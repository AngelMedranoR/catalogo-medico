export function useProductBadges() {
  const getProductBadges = (productName) => {
    if (!productName) return [];
    const lowerCaseName = productName.toLowerCase();
    const badges = [];

    // Compression badges for 'vendas'
    if (lowerCaseName.includes('venda')) {
      if (lowerCaseName.includes('1.5 metros') || lowerCaseName.includes('1.5metros') || lowerCaseName.includes('4.0 metros') || lowerCaseName.includes('4.0metros')) {
        badges.push('Compresión Suave');
      }
      if (lowerCaseName.includes('1.0 metros') || lowerCaseName.includes('1.0 metros')) {
        badges.push('Compresión Media');
      }
      if (lowerCaseName.includes('1.0metros') || lowerCaseName.includes('1.0metros')) {
        badges.push('Compresión Fuerte');
      }
    }

    // Faja badges
    if (lowerCaseName.includes('faja')) {
      if (lowerCaseName.includes('22cm')) {
        badges.push('22cm');
      }
      if (lowerCaseName.includes('30cm')) {
        badges.push('30cm');
      }
      if (lowerCaseName.includes('multiusos')) {
        badges.push('Multiusos');
      }
    }

    return badges;
  };

  return { getProductBadges };
}
