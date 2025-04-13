from flask import Flask, request, jsonify
import pandas as pd
import os

# import all functions from app file
from app import *

app = Flask(__name__)

@app.route("/onboarding/<user_id>", methods=["POST"])
def onboard_user(user_id):
    """
    Onboard a new user by creating their initial taste profile.
    Expects JSON body, for example:
    {
      "favorites": ["Pizza", "Sushi", "Tacos"],
      "dietary_restrictions": ["gluten-free", "halal"],
      "allergies": ["nuts", "shellfish"]
    }

    The build_onboarding_profile function uses that data, calls Gemini,
    and writes a new CSV in personaldata/<user_id>_profile.csv.
    """
    data = request.get_json(force=True)
    favorites_list = data.get("favorites", [])
    dietary_list = data.get("dietary_restrictions", [])
    allergies_list = data.get("allergies", [])

    # Create a small DataFrame for the user's favorite foods
    favorites_df = pd.DataFrame({"food_name": favorites_list})

    # Call the logic function, passing dietary/allergy lists
    user_profile = build_onboarding_profile(
        user_id,
        favorites_df,
        dietary_list=dietary_list,
        allergies_list=allergies_list
    )

    return jsonify({
        "message": f"Onboarding complete for user {user_id}",
        "user_profile": user_profile
    })


@app.route("/userprofile/<user_id>", methods=["GET"])
def api_user_profile(user_id):
    """
    Returns the user's existing profile from personaldata/<user_id>_profile.csv
    as JSON. 404 if not found.
    """
    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"Profile for {user_id} not found."}), 404
    return jsonify(user_profile)

@app.route("/restaurants", methods=["GET"])
def api_find_restaurants():
    """
    Example: /restaurants?lat=34.05&lon=-118.24&radius_value=2&radius_unit=miles
    Returns a JSON list of restaurants from the Google Maps Places API.
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
    POST body example:
    {
      "lat": 34.05,
      "lon": -118.24,
      "radius_value": 2,
      "radius_unit": "miles",
      "triedFoods": ["Burger Bonanza"]
    }
    Returns top recommended restaurants for the user (JSON).
    """
    data = request.get_json(force=True)
    lat = data.get("lat", 34.052235)
    lon = data.get("lon", -118.243683)
    radius_value = data.get("radius_value", 2)
    radius_unit = data.get("radius_unit", "miles")
    tried = data.get("triedFoods", [])

    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"No profile for user {user_id}"}), 404

    # Query restaurants
    restaurants = find_nearby_restaurants(lat, lon, radius_value, radius_unit)
    # Generate recommendations
    recs_df = generate_recommendations(user_profile, restaurants, tried, n=3)
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
    Updates user preferences in personaldata/<user_id>_profile.csv.
    """
    data = request.get_json(force=True)
    restaurant_name = data.get("restaurant_name", "")
    favorability = float(data.get("favorability", 0.0))
    comment = data.get("comment", "")

    user_profile = get_user_profile(user_id)
    if user_profile is None:
        return jsonify({"error": f"No profile for user {user_id}"}), 404

    mock_restaurant = {"name": restaurant_name}
    # This calls push_feedback, which internally calls update_user_profile
    push_feedback(user_profile, mock_restaurant, user_id)

    return jsonify({"message": f"Feedback recorded for {restaurant_name}."})

if __name__ == "__main__":
    # For local testing: python routes.py
    # Then go to http://127.0.0.1:5000 in your browser or use cURL/Postman
    app.run(debug=True)