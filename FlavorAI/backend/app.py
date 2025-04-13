import requests
import pandas as pd
import time
import os
import sys
import json
from google import genai
from google.genai import types
from plyer import gps

# Set up project paths and import API keys
current_dir = os.path.dirname(os.path.abspath(__file__))
key_dir = os.path.abspath(os.path.join(current_dir, ".."))
if key_dir not in sys.path:
    sys.path.insert(0, key_dir)

from APIkey import othersapi_key, geminiapi_key

# Create a single client for Gemini calls, using your geminiapi_key
client = genai.Client(api_key=geminiapi_key)

# Global variables
gps_location = {}       # Dictionary for storing device GPS location
RESTAURANT_COUNT = 20   # Number of nearby restaurants to return

# ---------------------
# 1. Acquire GPS Location using Device GPS
# ---------------------
def on_location(**kwargs):
    """
    Callback function triggered when a new GPS location is received.
    Updates the global gps_location dictionary.
    """
    global gps_location
    gps_location = kwargs
    print("GPS update received:", kwargs)


def get_geolocation(timeout=10):
    """
    Uses the device's native GPS via Plyer to obtain latitude and longitude.
    
    Args:
        timeout (int): Maximum seconds to wait for a GPS update.
        
    Returns:
        tuple: (latitude, longitude) if available; otherwise, (None, None)
    """
    try:
        gps.configure(on_location=on_location)
        gps.start(minTime=1000, minDistance=0)
    except NotImplementedError:
        print("GPS not implemented on this platform.")
        return None, None

    print("Waiting for GPS update...")
    start_time = time.time()
    while ('lat' not in gps_location or 'lon' not in gps_location) and (time.time() - start_time < timeout):
        time.sleep(1)
    gps.stop()

    if 'lat' in gps_location and 'lon' in gps_location:
        return gps_location['lat'], gps_location['lon']
    else:
        print("Failed to obtain GPS location within timeout.")
        return None, None


# ---------------------
# 2. Find Nearby Restaurants using Google Maps API
# ---------------------
def find_nearby_restaurants(lat, lon, radius_value, radius_unit):
    """
    Queries Google Maps Places API for restaurants near (lat, lon).
    
    Args:
        lat (float): Latitude
        lon (float): Longitude
        radius_value (float): Numeric radius value in the specified unit
        radius_unit (str): Either 'miles' or 'kilometers'
        
    Returns:
        list: Up to RESTAURANT_COUNT restaurant dictionaries from the API.
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
        print("Error contacting Google Maps API:", response.status_code, response.text)
        return []


# ---------------------
# 4. Get Restaurant Reviews using Google Places Details API
# ---------------------
def get_reviews(restaurant_id):
    """
    Queries Google Places Details API for reviews of a restaurant.
    
    Args:
        restaurant_id (str): The Google Place ID
        
    Returns:
        list: A list of review dicts with fields 'text' and 'rating'
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
            print(f"Google Places returned error: {data.get('status')}")
            return []
        reviews = data.get("result", {}).get("reviews", [])
        return [{"text": rev.get("text", ""), "rating": rev.get("rating")} for rev in reviews]
    except requests.RequestException as e:
        print("Error contacting Google Places API:", e)
        return []


# ---------------------
# 5. (Placeholder) Allergen & Dietary Info
# ---------------------
# Implement later as needed.


# ---------------------
# 6. Generate Flavor Profiles in a Single Gemini Call
# ---------------------

# Define the function signature that Gemini will call
generate_profiles_function = {
    "name": "generate_flavor_profiles",
    "description": (
        "Generate a JSON object mapping each restaurant's name to a flavor profile "
        "with 'salty', 'umami', 'spicy', 'sweet', 'sour' (floats between 0 and 1), "
        "and 'textures' (an array of descriptive strings)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "profiles": {
                "type": "object",
                "description": (
                    "A JSON object whose keys are restaurant names and whose values "
                    "are dictionaries of the form: "
                    "{'salty': float, 'umami': float, 'spicy': float, 'sweet': float, "
                    "'sour': float, 'textures': [str, ...]}."
                ),
                # We do not specify a detailed schema for the sub-objects
                # because they can be freeform (with known keys).
            }
        },
        "required": ["profiles"]
    },
}

def generate_flavor_profiles(restaurants):
    """
    Sends a single prompt to Gemini to obtain a flavor profile for each restaurant.
    The function uses the official google.genai client and function calling.

    Args:
        restaurants (list): List of restaurant dicts, each with at least 'name'.

    Returns:
        list: The same list of restaurants, each with an added 'flavor_profile' key.
    """
    # Build a textual prompt that describes the user’s request
    prompt_lines = [
        "You are given a list of restaurant names. Please call the function "
        "'generate_flavor_profiles' and produce a JSON object mapping each restaurant's name "
        "to a flavor profile with keys: 'salty', 'umami', 'spicy', 'sweet', 'sour', and 'textures'. "
        "Each dimension is a float in [0,1], and 'textures' is an array of strings. "
        "Only return the function call with no additional commentary.\n\nRestaurants:"
    ]
    for r in restaurants:
        name = r.get("name", "Unknown")
        prompt_lines.append(f"- {name}")
    prompt = "\n".join(prompt_lines)

    # Create a "Tool" object for the function declaration
    flavor_profiles_tool = types.Tool(
        function_declarations=[generate_profiles_function]
    )
    # Content config referencing our tool
    config = types.GenerateContentConfig(tools=[flavor_profiles_tool])

    # Make a single call to Gemini
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=config
    )

    # Extract the function call from the response (if present)
    candidate = response.candidates[0]
    content_parts = candidate.content.parts

    flavor_dict = {}
    if content_parts and content_parts[0].function_call:
        # There's a function call in the response
        fn_call = content_parts[0].function_call
        if fn_call.name == "generate_flavor_profiles":
            # We expect the 'profiles' argument to hold the mapping
            # For example: "args": {"profiles": {...}}
            args = fn_call.args or {}
            flavor_dict = args.get("profiles", {})
        else:
            print(f"Unexpected function call name: {fn_call.name}")
    else:
        # If no function call is found, fallback to an empty dictionary
        print("No function call found in the Gemini response. Returning original restaurants.")

    # Attach flavor profiles to each restaurant
    fallback_profile = {
        "salty": 0.5, "umami": 0.5, "spicy": 0.5,
        "sweet": 0.5, "sour": 0.5, "textures": ["varied"]
    }
    for r in restaurants:
        name = r.get("name", "")
        r["flavor_profile"] = flavor_dict.get(name, fallback_profile)

    return restaurants

# ---------------------
# 7. Import User Profile from CSV
# ---------------------
def get_user_profile():
    """
    Loads user profile from 'user_profile.csv':
        user_id, salty, umami, spicy, sweet, sour, texture_preferences, dietary_restrictions, allergies
    Returns a dict with these fields.
    """
    csv_file = "user_profile.csv"
    try:
        df = pd.read_csv(csv_file)
    except FileNotFoundError:
        print(f"Error: CSV file '{csv_file}' not found. Exiting.")
        return None

    row = df.iloc[0].to_dict()  # Using the first row for demonstration
    favorite_tastes = {taste: row.get(taste, 0) for taste in ["salty", "umami", "spicy", "sweet", "sour"]}

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


# ---------------------
# 8. Generate Restaurant Recommendations
# ---------------------
def generate_recommendations(user_profile, restaurants, tried_foods, n=3):
    """
    Filters out:
      - restaurants the user has already tried,
      - restaurants conflicting with user's dietary restrictions,
    then uses a single Gemini call to get flavor profiles for the filtered restaurants.
    
    Finally, it computes a similarity score for each restaurant vs. the user's tastes,
    and returns the top n recommendations as a DataFrame.
    """
    # Filter out tried restaurants
    filtered = [r for r in restaurants if r.get("name", "").lower() not in [t.lower() for t in tried_foods]]
    
    # Dietary restrictions: e.g., if user is "gluten-free", exclude places with "burger" in the name
    if "gluten-free" in user_profile.get("dietary_restrictions", []):
        filtered = [r for r in filtered if "burger" not in r.get("name", "").lower()]

    # Make a SINGLE Gemini call to get flavor profiles for these restaurants
    filtered = generate_flavor_profiles(filtered)

    # Convert to a DataFrame for easy scoring
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

    # Similarity scoring vs. user's favorite tastes
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


# ---------------------
# 9. Simulated Push Notification & Feedback
# ---------------------
def push_feedback(user_profile, restaurant):
    """
    Simulates push notification for feedback on a restaurant.
    Prompts user for favorability (0-1) and comment (e.g., "too salty").
    Calls update_user_profile to record changes.
    """
    print(f"\nPush notification: Rate your experience at {restaurant['name']}.")
    favorability = float(input("Enter favorability (0-1): "))
    comment = input("Enter feedback comment (e.g. 'too salty'): ")
    update_user_profile(user_profile, favorability, comment)
    return favorability, comment


# ---------------------
# 10. Update User Profile Based on Feedback & Write to CSV
# ---------------------
def update_user_profile(user_profile, favorability, comment):
    """
    Adjusts user's favorite tastes based on feedback, writes to user_profile.csv.
    If comment includes:
      - "too <taste>": decrease that taste by 0.1
      - "not <taste> enough": increase that taste by 0.1
    """
    csv_file = "user_profile.csv"
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

    # Write updated profile back to CSV
    try:
        df = pd.read_csv(csv_file)
        user_id = user_profile["user_id"]
        idx = df.index[df["user_id"] == user_id]
        if not idx.empty:
            df.loc[idx, "salty"] = user_profile["favorite_tastes"]["salty"]
            df.loc[idx, "umami"] = user_profile["favorite_tastes"]["umami"]
            df.loc[idx, "spicy"] = user_profile["favorite_tastes"]["spicy"]
            df.loc[idx, "sweet"] = user_profile["favorite_tastes"]["sweet"]
            df.loc[idx, "sour"] = user_profile["favorite_tastes"]["sour"]
            df.loc[idx, "texture_preferences"] = ", ".join(user_profile.get("texture_preferences", []))
            df.loc[idx, "dietary_restrictions"] = ", ".join(user_profile.get("dietary_restrictions", []))
            df.loc[idx, "allergies"] = ", ".join(user_profile.get("allergies", []))
            df.to_csv(csv_file, index=False)
            print(f"Profile for {user_id} updated and saved.")
        else:
            print(f"User {user_id} not found in CSV.")
    except Exception as e:
        print("Error updating CSV:", e)


# ---------------------
# Main Driver Function
# ---------------------
def main():
    # Acquire geolocation
    print("Testing GPS retrieval:")
    lat, lon = get_geolocation(timeout=5)
    if lat is None or lon is None:
        print("Using fallback location: LA")
        lat, lon = 34.052235, -118.243683

    # Example: search within 2 miles
    restaurants = find_nearby_restaurants(lat, lon, radius_value=2, radius_unit="miles")
    print(f"Found {len(restaurants)} restaurants nearby.")

    # Load user profile
    user_profile = get_user_profile()
    if user_profile is None:
        print("No user profile found; exiting.")
        return

    # Example: user has tried these restaurants
    tried_restaurants = ["Burger Bonanza", "Old Italian Place"]

    # Generate top recommendations
    recommendations_df = generate_recommendations(user_profile, restaurants, tried_restaurants, n=3)
    print("\nTop Recommended Restaurants:")
    print(recommendations_df)

    # Simulate push notification on the first recommendation, if any
    if not recommendations_df.empty:
        top_rec = recommendations_df.iloc[0].to_dict()
        print("\nSimulating feedback for top recommendation:")
        push_feedback(user_profile, top_rec)


if __name__ == "__main__":
    main()