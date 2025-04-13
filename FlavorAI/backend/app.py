import requests
import pandas as pd
import time
import os
import sys
import json
from google import genai
from google.genai import types
from plyer import gps
from flask import Flask, request, jsonify

###############################################################################
# Setup & Configuration
###############################################################################
current_dir = os.path.dirname(os.path.abspath(__file__))
key_dir = os.path.abspath(os.path.join(current_dir, ".."))
if key_dir not in sys.path:
    sys.path.insert(0, key_dir)

from APIkey import othersapi_key, geminiapi_key

client = genai.Client(api_key=geminiapi_key)
pd.set_option("display.max_columns", None)

gps_location = {}
RESTAURANT_COUNT = 20

app = Flask(__name__)

###############################################################################
# 1. GPS Location Acquisition
###############################################################################
def on_location(**kwargs):
    global gps_location
    gps_location = kwargs
    print("GPS update received:", kwargs)

def get_geolocation(timeout=10):
    try:
        gps.configure(on_location=on_location)
        gps.start(minTime=1000, minDistance=0)
    except NotImplementedError:
        print("GPS is not implemented on this platform.")
        return None, None

    print("Waiting for GPS update...")
    start_time = time.time()
    while ('lat' not in gps_location or 'lon' not in gps_location) and (time.time() - start_time < timeout):
        time.sleep(1)
    gps.stop()

    if 'lat' in gps_location and 'lon' in gps_location:
        return gps_location['lat'], gps_location['lon']
    else:
        print("Failed to acquire GPS location within the timeout.")
        return None, None

###############################################################################
# 2. Google Maps Search for Nearby Restaurants
###############################################################################
def find_nearby_restaurants(lat, lon, radius_value, radius_unit):
    if radius_unit.lower() in ['kilometers', 'km']:
        radius_meters = radius_value * 1000
    elif radius_unit.lower() in ['miles', 'mi']:
        radius_meters = radius_value * 1609.34
    else:
        print("Invalid radius unit. Use 'miles' or 'kilometers'.")
        return []

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        'location': f'{lat},{lon}',
        'radius': radius_meters,
        'type': 'restaurant',
        'key': othersapi_key
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        results = data.get('results', [])
        return results[:RESTAURANT_COUNT]
    else:
        print("Google Maps API error:", response.status_code, response.text)
        return []

###############################################################################
# 3. Google Places: Get Reviews
###############################################################################
def get_reviews(restaurant_id):
    endpoint = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "placeid": restaurant_id,
        "fields": "reviews",
        "key": othersapi_key
    }
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()
        if data.get("status") != "OK":
            print(f"Google Places API returned error: {data.get('status')}")
            return []
        reviews = data.get("result", {}).get("reviews", [])
        return [{"text": r.get("text", ""), "rating": r.get("rating")} for r in reviews]
    except requests.RequestException as e:
        print("Error contacting Google Places API:", e)
        return []

###############################################################################
# 4. Gemini: Single Function Call for Flavor Profiles
###############################################################################
def generate_flavor_profiles(restaurants):
    generate_profiles_function = {
        "name": "generate_flavor_profiles",
        "description": (
            "Generate a JSON object mapping each restaurant's name to a flavor profile "
            "with keys: 'salty', 'umami', 'spicy', 'sweet', 'sour' (floats between 0 and 1), "
            "and 'textures' (array of descriptive strings)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "profiles": {
                    "type": "object",
                    "description": (
                        "A JSON object whose keys are restaurant names and whose values "
                        "are dictionaries of the form: {"
                        "'salty': float, 'umami': float, 'spicy': float, 'sweet': float, "
                        "'sour': float, 'textures': [str, ...]}"
                    )
                }
            },
            "required": ["profiles"]
        },
    }

    prompt_lines = [
        "You are given a list of restaurant names. Please call the function "
        "'generate_flavor_profiles' and produce a JSON object mapping each restaurant's name "
        "to a flavor profile. Return ONLY the function call.\n\nRestaurants:"
    ]
    for r in restaurants:
        prompt_lines.append(f"- {r.get('name', 'Unknown')}")

    prompt = "\n".join(prompt_lines)
    flavor_profiles_tool = types.Tool(function_declarations=[generate_profiles_function])
    config = types.GenerateContentConfig(tools=[flavor_profiles_tool])

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=config
    )

    candidate = response.candidates[0]
    content_parts = candidate.content.parts
    flavor_dict = {}

    if content_parts and content_parts[0].function_call:
        fn_call = content_parts[0].function_call
        if fn_call.name == "generate_flavor_profiles":
            args = fn_call.args or {}
            flavor_dict = args.get("profiles", {})
        else:
            print(f"Unexpected function call name: {fn_call.name}")
    else:
        print("No function call found in Gemini response. Returning restaurants without flavor profiles.")

    fallback_profile = {"salty": 0.5, "umami": 0.5, "spicy": 0.5, "sweet": 0.5, "sour": 0.5, "textures": ["varied"]}
    for r in restaurants:
        name = r.get("name", "")
        r["flavor_profile"] = flavor_dict.get(name, fallback_profile)

    return restaurants

###############################################################################
# 5. Generating Restaurant Recommendations
###############################################################################
def generate_recommendations(user_profile, restaurants, tried_foods, n=3):
    filtered = [r for r in restaurants if r.get("name", "").lower() not in [t.lower() for t in tried_foods]]
    if "gluten-free" in user_profile.get("dietary_restrictions", []):
        filtered = [r for r in filtered if "burger" not in r.get("name", "").lower()]
    filtered = [r for r in filtered if r.get("opening_hours", {}).get("open_now") == True]
    filtered = generate_flavor_profiles(filtered)

    records = []
    for r in filtered:
        flavor = r.get("flavor_profile", {})
        records.append({
            "restaurant_id": r.get("id"),
            "name": r.get("name"),
            "vicinity": r.get("vicinity"),
            "salty": flavor.get("salty", 0),
            "umami": flavor.get("umami", 0),
            "spicy": flavor.get("spicy", 0),
            "sweet": flavor.get("sweet", 0),
            "sour": flavor.get("sour", 0),
            "textures": ", ".join(flavor.get("textures", []))
        })

    df = pd.DataFrame(records)

    def similarity(row):
        score = 0.0
        for taste_key in ["salty", "umami", "spicy", "sweet", "sour"]:
            user_val = user_profile["favorite_tastes"].get(taste_key, 0)
            rest_val = row[taste_key]
            score += 1 - abs(user_val - rest_val)
        return score / 5

    df["similarity"] = df.apply(similarity, axis=1)
    df = df.sort_values("similarity", ascending=False).head(n)
    return df

###############################################################################
# 6. Push Notification & Feedback
###############################################################################
def push_feedback(user_profile, restaurant, user_id):
    print(f"\nPush notification: Rate your experience at {restaurant['name']}.")
    favorability = float(input("Enter favorability (0-1): "))
    comment = input("Enter feedback comment (e.g. 'too salty'): ")
    update_user_profile(user_profile, favorability, comment, user_id)
    return favorability, comment

###############################################################################
# 7. Manage User Profiles in CSV
###############################################################################
def get_user_profile(user_id):
    csv_file = os.path.join("personaldata", f"{user_id}_profile.csv")
    try:
        df = pd.read_csv(csv_file)
    except FileNotFoundError:
        print(f"Error: Could not find '{csv_file}' for user {user_id}.")
        return None

    row = df.iloc[0].to_dict()
    favorite_tastes = {k: row.get(k, 0) for k in ["salty", "umami", "spicy", "sweet", "sour"]}

    def parse_list(val):
        if pd.isna(val):
            return []
        return [x.strip() for x in val.split(",") if x.strip()]

    return {
        "user_id": row.get("user_id"),
        "favorite_tastes": favorite_tastes,
        "texture_preferences": parse_list(row.get("texture_preferences", "")),
        "dietary_restrictions": parse_list(row.get("dietary_restrictions", "")),
        "allergies": parse_list(row.get("allergies", ""))
    }

def update_user_profile(user_profile, favorability, comment, user_id):
    csv_file = os.path.join("personaldata", f"{user_id}_profile.csv")
    comment_lower = comment.lower()

    for taste in ["salty", "umami", "spicy", "sweet", "sour"]:
        if f"too {taste}" in comment_lower:
            old_val = user_profile["favorite_tastes"][taste]
            new_val = max(old_val - 0.1, 0)
            user_profile["favorite_tastes"][taste] = new_val
            print(f"Updated {taste}: {old_val} -> {new_val}")
        elif f"not {taste} enough" in comment_lower:
            old_val = user_profile["favorite_tastes"][taste]
            new_val = min(old_val + 0.1, 1)
            user_profile["favorite_tastes"][taste] = new_val
            print(f"Updated {taste}: {old_val} -> {new_val}")

    try:
        df = pd.read_csv(csv_file)
        # Ensure columns for dietary_restrictions and allergies are strings
        df["dietary_restrictions"] = df["dietary_restrictions"].fillna("").astype(str)
        df["allergies"] = df["allergies"].fillna("").astype(str)

        idx = df.index[df["user_id"] == user_id]
        if not idx.empty:
            for taste in ["salty", "umami", "spicy", "sweet", "sour"]:
                df.loc[idx, taste] = user_profile["favorite_tastes"][taste]
            df.loc[idx, "texture_preferences"] = ", ".join(user_profile["texture_preferences"])
            df.loc[idx, "dietary_restrictions"] = ", ".join(user_profile["dietary_restrictions"])
            df.loc[idx, "allergies"] = ", ".join(user_profile["allergies"])
            df.to_csv(csv_file, index=False)
            print(f"Profile for user {user_id} updated and saved.")
        else:
            print(f"User {user_id} not found in CSV '{csv_file}'.")
    except Exception as e:
        print("Error updating CSV:", e)

###############################################################################
# 8. Create new userdata.csv for onboarding based on favorite foods
###############################################################################
def build_onboarding_profile(user_id, favorites_df):
    # collects user favorites, calls gemini to build tastes, prompts for diet/allergies
    build_profile_function = {
        "name": "build_user_taste_profile",
        "description": (
            "Create a JSON object with an overall taste profile for this user, "
            "including keys: 'salty', 'umami', 'spicy', 'sweet', 'sour' (floats in [0,1]) "
            "and 'texture_preferences' (array of descriptive strings)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "taste_profile": {
                    "type": "object",
                    "description": (
                        "The user's overall taste profile, including keys: "
                        "'salty', 'umami', 'spicy', 'sweet', 'sour' (floats in [0,1]), "
                        "and 'texture_preferences' (array of descriptive strings)."
                    )
                }
            },
            "required": ["taste_profile"]
        },
    }

    prompt_lines = [
        "You are given a list of foods that a user loves. Please call the function "
        "'build_user_taste_profile' returning a JSON object named 'taste_profile' "
        "with keys: 'salty', 'umami', 'spicy', 'sweet', 'sour' (floats in [0,1]) "
        "and 'texture_preferences' (an array of descriptive strings). Return ONLY the function call.\n",
        "Favorite Foods:"
    ]
    for _, row in favorites_df.iterrows():
        food_name = row.get("food_name", "Unknown Food")
        prompt_lines.append(f"- {food_name}")

    prompt = "\n".join(prompt_lines)
    build_profile_tool = types.Tool(function_declarations=[build_profile_function])
    config = types.GenerateContentConfig(tools=[build_profile_tool])
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=config
    )

    candidate = response.candidates[0]
    content_parts = candidate.content.parts
    fallback_profile = {
        "salty": 0.5, "umami": 0.5, "spicy": 0.5, "sweet": 0.5, "sour": 0.5,
        "texture_preferences": ["varied"]
    }
    taste_profile = fallback_profile

    if content_parts and content_parts[0].function_call:
        fn_call = content_parts[0].function_call
        if fn_call.name == "build_user_taste_profile":
            taste_profile = fn_call.args.get("taste_profile", fallback_profile)
        else:
            print(f"Unexpected function call name: {fn_call.name}")
    else:
        print("No function call found. Using fallback profile.")

    user_profile = {
        "user_id": user_id,
        "favorite_tastes": {
            "salty": taste_profile.get("salty", 0.5),
            "umami": taste_profile.get("umami", 0.5),
            "spicy": taste_profile.get("spicy", 0.5),
            "sweet": taste_profile.get("sweet", 0.5),
            "sour":  taste_profile.get("sour", 0.5)
        },
        "texture_preferences": taste_profile.get("texture_preferences", ["varied"]),
        "dietary_restrictions": [],
        "allergies": []
    }

    # prompt user for dietary restrictions
    num_dietary = int(input("How many dietary restrictions do you have? (0=none): "))
    dietary_data = []
    for i in range(num_dietary):
        restriction = input(f"Enter dietary restriction #{i+1}: ")
        dietary_data.append({"dietary_restriction": restriction})
    dietary_df = pd.DataFrame(dietary_data)

    # prompt user for allergies
    num_allergies = int(input("How many allergies do you have? (0=none): "))
    allergies_data = []
    for i in range(num_allergies):
        allergy = input(f"Enter allergy #{i+1}: ")
        allergies_data.append({"allergy": allergy})
    allergies_df = pd.DataFrame(allergies_data)

    if not dietary_df.empty:
        user_profile["dietary_restrictions"] = dietary_df["dietary_restriction"].tolist()
    if not allergies_df.empty:
        user_profile["allergies"] = allergies_df["allergy"].tolist()

    os.makedirs("personaldata", exist_ok=True)
    csv_file = os.path.join("personaldata", f"{user_id}_profile.csv")

    row_dict = {
        "user_id": user_profile["user_id"],
        "salty": user_profile["favorite_tastes"]["salty"],
        "umami": user_profile["favorite_tastes"]["umami"],
        "spicy": user_profile["favorite_tastes"]["spicy"],
        "sweet": user_profile["favorite_tastes"]["sweet"],
        "sour":  user_profile["favorite_tastes"]["sour"],
        "texture_preferences": ", ".join(user_profile["texture_preferences"]),
        "dietary_restrictions": ", ".join(user_profile["dietary_restrictions"]),
        "allergies": ", ".join(user_profile["allergies"]),
    }

    df = pd.DataFrame([row_dict])
    df.to_csv(csv_file, index=False)
    print(f"Created user profile at '{csv_file}'.")

    return user_profile

###############################################################################
# Main
###############################################################################
def main():
    example_user_id = "user123"

    # user favorites
    sample_favorites = pd.DataFrame({
        "food_name": ["Pizza", "Ice Cream", "Sushi", "Tacos"]
    })
    print(f"Building onboarding profile for user: {example_user_id}")
    new_profile = build_onboarding_profile(user_id=example_user_id, favorites_df=sample_favorites)
    print("Onboarding profile created:\n", new_profile, "\n")

    # Acquire device location (or fallback)
    print("Attempting to retrieve device GPS location...")
    lat, lon = get_geolocation(timeout=5)
    if lat is None or lon is None:
        print("GPS unavailable; using fallback: New York coords.")
        lat, lon = 40.7128, -74

    restaurants = find_nearby_restaurants(lat, lon, radius_value=2, radius_unit="miles")
    print(f"Found {len(restaurants)} restaurants near ({lat}, {lon}).")

    user_profile = get_user_profile(example_user_id)
    if user_profile is None:
        print("No user profile found.")
        return

    tried_restaurants = ["Burger Bonanza", "Old Italian Place"]

    print("\nGenerating recommendations...")
    recommendations_df = generate_recommendations(user_profile, restaurants, tried_restaurants, n=3)
    print("\nTop Recommended Restaurants:")
    print(recommendations_df)

    if not recommendations_df.empty:
        top_rec = recommendations_df.iloc[0].to_dict()
        print("\nSimulating user feedback on top recommendation:")
        push_feedback(user_profile, top_rec, example_user_id)

    print("\nEnd of main demonstration.")

if __name__ == "__main__":
    main()