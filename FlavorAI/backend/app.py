import requests
import pandas as pd
import time
import os
import sys
import json
from google import genai
from google.genai import types
from plyer import gps

###############################################################################
# Setup & Configuration
###############################################################################
current_dir = os.path.dirname(os.path.abspath(__file__))
key_dir = os.path.abspath(os.path.join(current_dir, ".."))
if key_dir not in sys.path:
    sys.path.insert(0, key_dir)
from APIkey import othersapi_key, geminiapi_key

# Create a Gemini client for flavor profile generation
client = genai.Client(api_key=geminiapi_key)

# Always show all columns in Pandas DataFrames
pd.set_option("display.max_columns", None)

# Globals
gps_location = {}       # Dictionary to store the latest device GPS location
RESTAURANT_COUNT = 20   # Maximum number of restaurants returned by Google Maps

###############################################################################
# 1. GPS Location Acquisition
###############################################################################
def on_location(**kwargs):
    """
    Callback function for Plyer GPS updates. Stores new location data in gps_location.
    """
    global gps_location
    gps_location = kwargs
    print("GPS update received:", kwargs)

def get_geolocation(timeout=10):
    """
    Attempts to acquire latitude & longitude from the device's GPS via Plyer.
    If not implemented or if the timeout is reached, returns (None, None).

    Args:
        timeout (int): Seconds to wait for a GPS update

    Returns:
        (float, float) | (None, None): The (latitude, longitude) or None if unavailable
    """
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
    """
    Queries the Google Maps Places API for restaurants near (lat, lon),
    limited by the radius given in miles or kilometers.

    Args:
        lat (float): Latitude of current location
        lon (float): Longitude of current location
        radius_value (float): Numeric radius in the provided unit
        radius_unit (str): 'miles' or 'kilometers'

    Returns:
        list: Up to RESTAURANT_COUNT dictionaries describing nearby restaurants
    """
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
    """
    Retrieves reviews for a given restaurant ID via the Google Places Details API.

    Args:
        restaurant_id (str): The Google Place ID

    Returns:
        list of dict: Each with 'text' and 'rating' for the review
    """
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
    """
    Makes ONE aggregated call to Gemini to retrieve flavor profiles for all restaurants at once.

    Args:
        restaurants (list): Each element is a dict with at least a 'name' key.

    Returns:
        list: The original list with each dict having an added 'flavor_profile' field.
    """
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
    """
    Filters out:
      - Restaurants the user has already tried,
      - Restaurants conflicting with user's dietary restrictions,
      - Restaurants that are currently not open,
    then uses a single Gemini call to get flavor profiles for the filtered restaurants.

    Finally, it computes a similarity score for each restaurant vs. the user's tastes,
    and returns the top n recommendations as a DataFrame.
    """
    filtered = [r for r in restaurants if r.get("name", "").lower() not in [t.lower() for t in tried_foods]]
    if "gluten-free" in user_profile.get("dietary_restrictions", []):
        filtered = [r for r in filtered if "burger" not in r.get("name", "").lower()]
    filtered = [r for r in filtered if r.get("opening_hours", {}).get("open_now") == True]
    filtered = generate_flavor_profiles(filtered)

    records = []
    for r in filtered:
        flavor = r.get("flavor_profile", {})
        records.append({
            "restaurant_id": r.get("place_id"),
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
    """
    Simulates a push notification for feedback on a recommended restaurant.
    The user enters a favorability score (0-1) and comment (e.g. "too salty").
    Then calls update_user_profile(...) with the user ID.
    """
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
def build_onboarding_profile(user_id, favorites_df, dietary_list=None, allergies_list=None):
    """
    Takes a user_id and a list (DataFrame) of the user's favorite foods for onboarding.
    Calls Gemini once, expecting a single function call ("build_user_taste_profile")
    that returns:
      - salty, umami, spicy, sweet, sour (floats in [0,1])
      - texture_preferences (array of descriptive strings)

    dietary_list and allergies_list are also provided as lists of strings
    from the API call, instead of prompting interactively.

    Then writes the new user profile to personaldata/<user_id>_profile.csv
    for future use.

    Args:
        user_id (str): Unique identifier for the user.
        favorites_df (pd.DataFrame): A DataFrame of user’s favorite foods, e.g. with a 'food_name' column.
        dietary_list (list): A list of user-specified dietary restrictions (strings).
        allergies_list (list): A list of user-specified allergies (strings).

    Returns:
        dict: The in-memory representation of the user’s newly created profile,
              including taste values, texture preferences, dietary_restrictions, and allergies.
    """

    # Prepare the Gemini function signature
    build_profile_function = {
        "name": "build_user_taste_profile",
        "description": (
            "Create a JSON object with an overall taste profile for this user, "
            "including keys: 'salty', 'umami', 'spicy', 'sweet', 'sour' (floats in [0,1]) "
            "and 'texture_preferences' (array of strings)."
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

    # Build the prompt for Gemini
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

    # Create a "Tool" for Gemini's function calling
    build_profile_tool = types.Tool(function_declarations=[build_profile_function])
    config = types.GenerateContentConfig(tools=[build_profile_tool])

    # Make a single Gemini call
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=config
    )

    # Parse the Gemini response
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

    # Build the user profile dict
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
        "dietary_restrictions": dietary_list if dietary_list else [],
        "allergies": allergies_list if allergies_list else []
    }

    # Write user profile to personaldata/<user_id>_profile.csv
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