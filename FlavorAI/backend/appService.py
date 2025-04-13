from flask import Flask, request, jsonify
import pandas as pd
import os
from app import *

# Assume all your existing imports and function definitions:
# (get_geolocation, find_nearby_restaurants, get_user_profile, update_user_profile, 
#  generate_flavor_profiles, generate_recommendations, build_onboarding_profile, etc.)
# are already defined above or imported from a separate module.

app = Flask(__name__)

@app.route("/onboarding/<user_id>", methods=["POST"])
def onboard_user(user_id):
    """
    Onboard a new user via POST:
      - Expects JSON in the body with their favorite foods (list of strings).
      - Calls build_onboarding_profile (which prompts user for dietary/allergy info).
      - Returns the newly built user profile as JSON.
    """
    data = request.get_json(force=True)
    # data might look like: { "favorites": ["Pizza", "Sushi", "Tacos"] }
    favorites_list = data.get("favorites", [])
    # build a small DataFrame from the user’s favorites
    favorites_df = pd.DataFrame({"food_name": favorites_list})
    user_profile = build_onboarding_profile(user_id, favorites_df)
    return jsonify({
        "message": f"Onboarding complete for user {user_id}",
        "user_profile": user_profile
    })

@app.route("/userprofile/<user_id>", methods=["GET"])
def get_userprofile(user_id):
    """
    GET existing user profile from personaldata/<user_id>_profile.csv
    and return as JSON.
    """
    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"User {user_id} profile not found."}), 404
    return jsonify(user_profile)

@app.route("/restaurants", methods=["GET"])
def api_find_restaurants():
    """
    Example GET endpoint: /restaurants?lat=34.05&lon=-118.24&radius_value=2&radius_unit=miles
    Returns a JSON list of restaurants from find_nearby_restaurants.
    """
    lat = float(request.args.get("lat", 34.052235))
    lon = float(request.args.get("lon", -118.243683))
    radius_value = float(request.args.get("radius_value", 2))
    radius_unit = request.args.get("radius_unit", "miles")
    results = find_nearby_restaurants(lat, lon, radius_value, radius_unit)
    return jsonify(results)

@app.route("/recommendations/<user_id>", methods=["POST"])
def api_recommendations(user_id):
    """
    POST endpoint for generating user-based restaurant recommendations.
    Expects JSON with lat/lon, triedFoods (list of strings), and radius (value/unit).
    Example body:
    {
      "lat": 34.05,
      "lon": -118.24,
      "radius_value": 2,
      "radius_unit": "miles",
      "triedFoods": ["Burger Bonanza"]
    }
    """
    data = request.get_json(force=True)
    lat = data.get("lat", 34.052235)
    lon = data.get("lon", -118.243683)
    rad_val = data.get("radius_value", 2)
    rad_unit = data.get("radius_unit", "miles")
    tried = data.get("triedFoods", [])

    # Load user profile
    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"No profile found for {user_id}"}), 404

    # Find restaurants
    restaurants = find_nearby_restaurants(lat, lon, rad_val, rad_unit)
    # Generate recommendations
    recs_df = generate_recommendations(user_profile, restaurants, tried, n=5)
    recs_json = recs_df.to_dict(orient="records")

    return jsonify({"recommendations": recs_json})

@app.route("/feedback/<user_id>", methods=["POST"])
def api_feedback(user_id):
    """
    POST endpoint to simulate user feedback on a restaurant.
    Example JSON body:
    {
      "restaurant_name": "Philippe The Original",
      "favorability": 0.7,
      "comment": "too salty"
    }
    Then updates user preferences in personaldata/<user_id>_profile.csv
    """
    data = request.get_json(force=True)
    restaurant_name = data.get("restaurant_name", "Unknown")
    favorability = float(data.get("favorability", 0.0))
    comment = data.get("comment", "")

    # Load user profile
    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"No profile found for {user_id}"}), 404

    # We don't have the entire 'restaurant' dict here, so let's mock something minimal
    mock_restaurant = {"name": restaurant_name}
    # Now run the push_feedback
    push_feedback(user_profile, mock_restaurant, user_id)

    return jsonify({"message": f"Feedback recorded for {restaurant_name}"})


if __name__ == "__main__":
    # For local testing, run: python your_file.py
    # Then call endpoints like http://127.0.0.1:5000/onboarding/user123
    app.run(debug=True)