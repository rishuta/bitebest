const calculateFinalPrice = (foodPriceRecord) => {
  const foodPrice = foodPriceRecord.foodPrice || 0;
  const deliveryFee = foodPriceRecord.deliveryFee || 0;
  const packagingFee = foodPriceRecord.packagingFee || 0;
  const offerType = foodPriceRecord.offerType || 'none';
  const offerValue = foodPriceRecord.offerValue || 0;
  const minOrder = foodPriceRecord.minOrder || 0;

  const canApplyOffer = foodPrice >= minOrder;
  let discountApplied = 0;

  if (canApplyOffer) {
    if (offerType === 'percentage') {
      discountApplied = (foodPrice * offerValue) / 100;
    }

    if (offerType === 'flat') {
      discountApplied = offerValue;
    }

    if (offerType === 'freeDelivery') {
      discountApplied = deliveryFee;
    }
  }

  const finalPrice = Math.max(foodPrice + deliveryFee + packagingFee - discountApplied, 0);

  return {
    finalPrice,
    discountApplied,
  };
};

module.exports = calculateFinalPrice;
