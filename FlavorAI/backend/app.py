import requests
import pandas as pd
import time
import os
import sys
import json
from plyer import gps

# Set up project paths and import API keys
current_dir = os.path.dirname(os.path.abspath(__file__))
key_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if key_dir not in sys.path:
    sys.path.insert(0, key_dir)
from APIkey import PlacesAPI_key, geminiapi_key

# Global variables
gps_location = {}  # Dictionary for storing device GPS location
radius = 1000      # Search radius (in meters) for nearby restaurants

# ---------------------
# 1. Acquire GPS Location using Device GPS
# ---------------------
def on_location(**kwargs):
    """
    Callback function triggered when a new GPS location is received.
    Updates the global gps_location with the latest data.
    """
    global gps_location
    gps_location = kwargs
    print("GPS update received:", kwargs)


def get_geolocation(timeout=10):
    """
    Uses the device's native GPS via Plyer to obtain the current latitude and longitude.
    
    Args:
        timeout (int): Maximum seconds to wait for a GPS update.
        
    Returns:
        tuple: (latitude, longitude) if available; otherwise, (None, None)
    """
    try:
        gps.configure(on_location=on_location)
        gps.start(minTime=1000, minDistance=0)
    except NotImplementedError:
        print("GPS functionality not implemented on this platform.")
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
def find_nearby_restaurants(lat, lon):
    """
    Queries the Google Maps Places API to search for nearby restaurants.

    Args:
        lat (float): Latitude.
        lon (float): Longitude.
        
    Returns:
        list: A list of restaurant data dictionaries.
    """
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        'location': f'{lat},{lon}',
        'radius': radius,
        'type': 'restaurant',
        'key': PlacesAPI_key
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        return data.get('results', [])
    else:
        print("Error contacting Google Maps API:", response.status_code, response.text)
        return []


# ---------------------
# 3. Parse Restaurant Style using Gemini NLP
# ---------------------
def parse_restaurant_style(restaurant):
    """
    Infers the cuisine style of a restaurant by sending a prompt to Google’s Gemini AI.
    
    The model is instructed to return exactly one word among:
    Italian, Chinese, Japanese, Indian, American, or General.
    
    Args:
        restaurant (dict): Restaurant data (must include "name").
        
    Returns:
        str: Inferred cuisine style.
    """
    name = restaurant.get("name", "")
    prompt = (f"Determine the cuisine style of a restaurant based solely on its name. "
              f"Return exactly one word among the following: Italian, Chinese, Japanese, "
              f"Indian, American, or General. Restaurant Name: '{name}'.")
    endpoint = "https://gemini.googleapis.com/v1/complete"  # Adjust as needed
    headers = {
        "Authorization": f"Bearer {geminiapi_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "max_tokens": 10,
        "temperature": 0.2,
        "top_p": 0.8
    }
    try:
        response = requests.post(endpoint, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        generated_text = result.get("choices", [{}])[0].get("text", "").strip()
        valid_styles = ["Italian", "Chinese", "Japanese", "Indian", "American", "General"]
        for style in valid_styles:
            if style.lower() in generated_text.lower():
                return style
        return "General"
    except requests.RequestException as e:
        print("Error calling Gemini API:", e)
        return "General"


# ---------------------
# 4. Get Restaurant Reviews using Google Places Details API
# ---------------------
def get_reviews(restaurant_id):
    """
    Queries the Google Maps Places Details API to get reviews for a restaurant.

    Args:
        restaurant_id (str): The Google Place ID.
        
    Returns:
        list: A list of review dictionaries with 'text' and 'rating'.
    """
    endpoint = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "placeid": restaurant_id,
        "fields": "reviews",
        "key": PlacesAPI_key
    }
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()
        if data.get("status") != "OK":
            print(f"Google Maps API returned error: {data.get('status')}")
            return []
        reviews = data.get("result", {}).get("reviews", [])
        return [{"text": rev.get("text", ""), "rating": rev.get("rating")} for rev in reviews]
    except requests.RequestException as e:
        print("Error contacting Google Maps API:", e)
        return []


# ---------------------
# 5. (Placeholder) Get Allergen and Dietary Information on Food Items
# ---------------------
# (This section can be implemented later as needed.)

# ---------------------
# 6. Generate Taste Profile using Gemini AI
# ---------------------
def generate_taste_profile(restaurant):
    """
    Generates a taste profile for a restaurant's signature dish using Gemini AI.
    
    The JSON output is expected to include keys: 'salty', 'umami', 'spicy', 'sweet', 'sour', and 'textures'.
    
    Args:
        restaurant (dict): Restaurant data.
        
    Returns:
        dict: Taste profile dictionary.
    """
    style = parse_restaurant_style(restaurant)
    prompt = (f"Based on {style} cuisine, provide a JSON object that represents the typical flavor profile of "
              f"a restaurant's signature dish. The JSON must include 'salty', 'umami', 'spicy', "
              f"'sweet', 'sour' (floats between 0 and 1) and 'textures' (an array of descriptive strings). "
              f"Return only the JSON object.")
    endpoint = "https://gemini.googleapis.com/v1/complete"  # Adjust as needed
    headers = {
        "Authorization": f"Bearer {geminiapi_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "max_tokens": 150,
        "temperature": 0.3,
        "top_p": 0.9
    }
    try:
        response = requests.post(endpoint, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        generated_text = result.get("choices", [{}])[0].get("text", "").strip()
        inferred_profile = json.loads(generated_text)
        required_keys = ["salty", "umami", "spicy", "sweet", "sour", "textures"]
        if all(key in inferred_profile for key in required_keys):
            return inferred_profile
        else:
            raise ValueError("Missing required keys in Gemini output")
    except Exception as e:
        print("Gemini inference failed for style", style, "Error:", e)
        # Fallback profiles by style
        fallback_profiles = {
            "Italian": {"salty": 0.7, "umami": 0.8, "spicy": 0.2, "sweet": 0.3, "sour": 0.2, "textures": ["al dente", "creamy"]},
            "Chinese": {"salty": 0.6, "umami": 0.7, "spicy": 0.3, "sweet": 0.4, "sour": 0.3, "textures": ["crispy", "soft"]},
            "Japanese": {"salty": 0.5, "umami": 0.9, "spicy": 0.1, "sweet": 0.2, "sour": 0.1, "textures": ["tender", "rice-like"]},
            "Indian": {"salty": 0.6, "umami": 0.7, "spicy": 0.8, "sweet": 0.3, "sour": 0.3, "textures": ["chunky", "creamy"]},
            "American": {"salty": 0.7, "umami": 0.6, "spicy": 0.4, "sweet": 0.5, "sour": 0.2, "textures": ["crispy", "juicy"]},
            "General": {"salty": 0.5, "umami": 0.5, "spicy": 0.5, "sweet": 0.5, "sour": 0.5, "textures": ["varied"]}
        }
        return fallback_profiles.get(style, fallback_profiles["General"])


# ---------------------
# 7. Import User Profile Data from CSV
# ---------------------
def get_user_profile():
    """
    Reads user profile data from 'user_profile.csv' and returns a dictionary containing:
      - "user_id"
      - "favorite_tastes": dict for tastes (salty, umami, spicy, sweet, sour)
      - "texture_preferences": list of strings
      - "dietary_restrictions": list of strings
      - "allergies": list of strings
      
    Returns:
        dict: User profile dictionary.
    """
    csv_file = "user_profile.csv"
    try:
        df = pd.read_csv(csv_file)
    except FileNotFoundError:
        print(f"Error: CSV file '{csv_file}' not found.")
        return None

    row = df.iloc[0].to_dict()  # For demonstration, use the first row
    favorite_tastes = {taste: row.get(taste, 0) for taste in ["salty", "umami", "spicy", "sweet", "sour"]}

    def parse_list(value):
        if pd.isna(value):
            return []
        return [item.strip() for item in value.split(",") if item.strip()]

    texture_preferences = parse_list(row.get("texture_preferences", ""))
    dietary_restrictions = parse_list(row.get("dietary_restrictions", ""))
    allergies = parse_list(row.get("allergies", ""))

    return {
        "user_id": row.get("user_id"),
        "favorite_tastes": favorite_tastes,
        "texture_preferences": texture_preferences,
        "dietary_restrictions": dietary_restrictions,
        "allergies": allergies
    }


# ---------------------
# 8. Generate Restaurant Recommendations
# ---------------------
def generate_recommendations(user_profile, restaurants, tried_foods, n=3):
    """
    Generates top restaurant recommendations based on the user's taste profile.
    
    The function:
      - Filters out restaurants already tried and those that conflict with dietary restrictions.
      - For each remaining restaurant, obtains a taste profile via generate_taste_profile.
      - Computes a similarity score between the restaurant's taste profile and the user's favorite tastes.
      - Returns the top n recommendations as a Pandas DataFrame.
    
    Args:
        user_profile (dict): Contains "favorite_tastes" and "dietary_restrictions".
        restaurants (list): List of restaurant dictionaries.
        tried_foods (list): List of restaurant names already tried.
        n (int): Number of recommendations to return.
        
    Returns:
        DataFrame: Recommended restaurants with similarity scores.
    """
    # Filter out already tried restaurants.
    filtered = [
        r for r in restaurants if r.get("name", "").lower() not in [f.lower() for f in tried_foods]
    ]
    
    # Apply dietary restrictions (example: for gluten-free, exclude names containing "burger").
    if "gluten-free" in user_profile.get("dietary_restrictions", []):
        filtered = [r for r in filtered if "burger" not in r.get("name", "").lower()]
    
    records = []
    for r in filtered:
        taste = generate_taste_profile(r)
        style = parse_restaurant_style(r)
        record = {
            "restaurant_id": r.get("id"),
            "name": r.get("name"),
            "vicinity": r.get("vicinity"),
            "style": style,
            "salty": taste.get("salty", 0),
            "umami": taste.get("umami", 0),
            "spicy": taste.get("spicy", 0),
            "sweet": taste.get("sweet", 0),
            "sour": taste.get("sour", 0),
            "textures": ", ".join(taste.get("textures", []))
        }
        records.append(record)
    
    taste_df = pd.DataFrame(records)

    def similarity(row):
        score = 0.0
        for taste in ["salty", "umami", "spicy", "sweet", "sour"]:
            user_value = user_profile["favorite_tastes"].get(taste, 0)
            restaurant_value = row[taste]
            score += 1 - abs(user_value - restaurant_value)
        return score / 5

    taste_df["similarity"] = taste_df.apply(similarity, axis=1)
    recommendations = taste_df.sort_values("similarity", ascending=False).head(n)
    return recommendations


# ---------------------
# 9. Simulated Push Notification and Feedback Collection
# ---------------------
def push_feedback(user_profile, restaurant):
    """
    Simulates sending a push notification to the user for feedback on a restaurant.
    
    Args:
        user_profile (dict): The current user profile.
        restaurant (dict): The restaurant data.
    
    Returns:
        tuple: (favorability (float), comment (str))
    """
    print(f"\nPush notification: How was your experience at {restaurant['name']}?")
    print("Rate your favorability (0-1) and provide feedback (e.g., 'too salty').")
    favorability = float(input("Enter favorability (0-1): "))
    comment = input("Enter feedback comment: ")
    update_user_profile(user_profile, favorability, comment)
    return favorability, comment


# ---------------------
# 10. Update User Profile Based on Feedback and Write to CSV
# ---------------------
def update_user_profile(user_profile, favorability, comment):
    """
    Adjusts the user's favorite tastes based on feedback and writes changes back to the CSV.
    
    For each taste dimension mentioned in the comment:
      - "too <taste>": decrease that taste by 0.1.
      - "not <taste> enough": increase that taste by 0.1.
    
    Args:
        user_profile (dict): Current user profile.
        favorability (float): Favorability rating (0-1).
        comment (str): Feedback comment.
    
    Returns:
        None
    """
    csv_file = "user_profile.csv"
    comment_lower = comment.lower()
    for taste in ["salty", "umami", "spicy", "sweet", "sour"]:
        if f"too {taste}" in comment_lower:
            old_value = user_profile["favorite_tastes"].get(taste, 0)
            new_value = max(old_value - 0.1, 0)
            user_profile["favorite_tastes"][taste] = new_value
            print(f"Updated {taste}: {old_value} -> {new_value}")
        elif f"not {taste} enough" in comment_lower:
            old_value = user_profile["favorite_tastes"].get(taste, 0)
            new_value = min(old_value + 0.1, 1)
            user_profile["favorite_tastes"][taste] = new_value
            print(f"Updated {taste}: {old_value} -> {new_value}")
    try:
        df = pd.read_csv(csv_file)
        user_id = user_profile["user_id"]
        idx = df.index[df["user_id"] == user_id]
        if not idx.empty:
            df.loc[idx, "salty"] = user_profile["favorite_tastes"].get("salty")
            df.loc[idx, "umami"] = user_profile["favorite_tastes"].get("umami")
            df.loc[idx, "spicy"] = user_profile["favorite_tastes"].get("spicy")
            df.loc[idx, "sweet"] = user_profile["favorite_tastes"].get("sweet")
            df.loc[idx, "sour"] = user_profile["favorite_tastes"].get("sour")
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
    # Test GPS retrieval
    print("Testing GPS retrieval:")
    lat, lon = get_geolocation(timeout=5)
    if lat and lon:
        print(f"Location obtained: {lat}, {lon}")
    else:
        print("Using fallback location (LA).")
        lat, lon = 34.052235, -118.243683

    # Query nearby restaurants
    restaurants = find_nearby_restaurants(lat, lon)
    print(f"Found {len(restaurants)} restaurants.")

    # Load user profile from CSV
    user_profile = get_user_profile()
    if user_profile is None:
        print("User profile not found. Exiting.")
        return

    # List of restaurants already tried by the user (example)
    tried_restaurants = ["Burger Bonanza", "Old Italian Place"]

    # Generate recommendations
    recommendations_df = generate_recommendations(user_profile, restaurants, tried_restaurants, n=3)
    print("Top Recommended Restaurants:")
    print(recommendations_df)

    # Simulate push notification and collect feedback for the top recommendation
    if not recommendations_df.empty:
        first_rec = recommendations_df.iloc[0].to_dict()
        print("Simulating feedback for first recommendation:")
        push_feedback(user_profile, first_rec)


if __name__ == "__main__": 
    main()