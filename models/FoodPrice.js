const mongoose = require("mongoose");

const foodPriceSchema = new mongoose.Schema(
  {
    restaurant: { type: String, required: true, trim: true },
    item: { type: String, required: true, trim: true },
    platform: { type: String, required: true, trim: true },
    rating: { type: Number },
    eta: { type: String, trim: true },
    foodPrice: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    packagingFee: { type: Number, default: 0 },
    offerType: {
      type: String,
      enum: ["none", "percentage", "flat", "freeDelivery"],
      default: "none",
    },
    offerValue: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "foodprices" }
);

module.exports = mongoose.model("FoodPrice", foodPriceSchema);
