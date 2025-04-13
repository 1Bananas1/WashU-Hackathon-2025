from flask import Flask, request, jsonify
import pandas as pd
import os

from app import *

current_dir = os.path.dirname(os.path.abspath(__file__))
key_dir = os.path.abspath(os.path.join(current_dir, ".."))
if key_dir not in sys.path:
    sys.path.insert(0, key_dir)
from APIkey import othersapi_key, geminiapi_key

from flask_cors import CORS  # For cross-origin support

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests so React can call your Flask server

@app.route("/onboarding/<user_id>", methods=["POST"])
def onboard_user(user_id):
    """
    Onboard a new user by creating their initial taste profile.
    Expects JSON body, e.g.:
    {
      "favorites": ["Pizza", "Sushi", "Tacos"],
      "dietary_restrictions": ["gluten-free", "halal"],
      "allergies": ["nuts", "shellfish"]
    }
    """
    data = request.get_json(force=True)
    favorites_list = data.get("favorites", [])
    dietary_list = data.get("dietary_restrictions", [])
    allergies_list = data.get("allergies", [])

    favorites_df = pd.DataFrame({"food_name": favorites_list})
    user_profile = build_onboarding_profile(
        user_id, favorites_df,
        dietary_list=dietary_list,
        allergies_list=allergies_list
    )
    return jsonify({
        "message": f"Onboarding complete for user {user_id}",
        "user_profile": user_profile
    })

@app.route("/userprofile/<user_id>", methods=["GET"])
def api_user_profile(user_id):
    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"Profile for {user_id} not found."}), 404
    return jsonify(user_profile)

@app.route("/restaurants", methods=["GET"])
def api_find_restaurants():
    lat = float(request.args.get("lat", 34.052235))
    lon = float(request.args.get("lon", -118.243683))
    radius_value = float(request.args.get("radius_value", 2))
    radius_unit = request.args.get("radius_unit", "miles")
    results = find_nearby_restaurants(lat, lon, radius_value, radius_unit)
    return jsonify(results)

@app.route("/recommendations/<user_id>", methods=["POST"])
def api_recommendations(user_id):
    data = request.get_json(force=True)
    lat = data.get("lat", 34.052235)
    lon = data.get("lon", -118.243683)
    radius_value = data.get("radius_value", 2)
    radius_unit = data.get("radius_unit", "miles")
    tried = data.get("triedFoods", [])
    n = data.get("n", 5)  # default to 5 if not provided

    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"No profile for user {user_id}"}), 404

    # (Find restaurants using lat/lon, radius_value, etc.)
    restaurants = find_nearby_restaurants(lat, lon, radius_value, radius_unit)

    # Pass the 'n' to generate_recommendations
    recs_df = generate_recommendations(user_profile, restaurants, tried, n)
    return jsonify({"recommendations": recs_df.to_dict(orient="records")})

@app.route("/feedback/<user_id>", methods=["POST"])
def api_feedback(user_id):
    """
    POST body example:
    {
      "restaurant_name": "Philippe The Original",
      "favorability": 0.8,
      "comment": "too salty"
    }
    """
    data = request.get_json(force=True)
    restaurant_name = data.get("restaurant_name", "")
    favorability = float(data.get("favorability", 0.0))
    comment = data.get("comment", "")

    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"No profile for user {user_id}"}), 404

    mock_restaurant = {"name": restaurant_name}
    push_feedback(user_profile, mock_restaurant, user_id)
    return jsonify({"message": f"Feedback recorded for {restaurant_name}."})

@app.route("/restaurant/<restaurant_id>", methods=["GET"])
def api_restaurant_info(restaurant_id):
    """
    Returns detailed info about a specific restaurant (place_id) by calling Google Places Details API.
    This 'restaurant_id' should be the Google 'place_id' from your recommendations data.
    """
    endpoint = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "placeid": restaurant_id,  # The place_id from the URL param
        "fields": (
            # Which fields we want from Google Places
            "name,formatted_address,formatted_phone_number,website,"
            "opening_hours,geometry,reviews"
        ),
        "key": othersapi_key  # imported from your app.py / APIkey.py
    }

    try:
        resp = requests.get(endpoint, params=params)
        resp.raise_for_status()
    except requests.RequestException as e:
        return jsonify({"error": f"Error contacting Google Places API: {str(e)}"}), 500

    data = resp.json()
    if data.get("status") != "OK":
        return jsonify({"error": f"Google Places error: {data.get('status')}"}), 400

    result = data.get("result", {})

    # Parse out relevant fields
    name = result.get("name")
    address = result.get("formatted_address")
    phone = result.get("formatted_phone_number")
    website = result.get("website")

    # Opening hours
    opening_data = result.get("opening_hours", {})
    weekday_text = opening_data.get("weekday_text", [])

    # Google reviews
    raw_reviews = result.get("reviews", [])
    reviews = []
    for rev in raw_reviews:
        reviews.append({
            "user": rev.get("author_name"),
            "rating": rev.get("rating"),
            "comment": rev.get("text")
        })

    # geometry for lat/lng
    geometry = result.get("geometry", {})
    location = geometry.get("location", {})
    lat = location.get("lat")
    lng = location.get("lng")

    # Build a final dictionary with the data you want to return
    restaurant_info = {
        "name": name,
        "address": address,
        "phone": phone,
        "website": website,
        "opening_hours": weekday_text,
        "reviews": reviews,
        "location": {"lat": lat, "lng": lng},
    }

    return jsonify(restaurant_info)

if __name__ == "__main__":
    app.run(debug=True)