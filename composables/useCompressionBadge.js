export function useCompressionBadge() {
  const getCompressionType = (productName) => {
    if (!productName) return null;
    const lowerCaseName = productName.toLowerCase();
    if (!lowerCaseName.includes('venda')) return null;

    if (lowerCaseName.includes('1.5 metros') || lowerCaseName.includes('1.5metros') || lowerCaseName.includes('4.0 metros') || lowerCaseName.includes('4.0metros')) {
      return 'Suave';
    }
    if (lowerCaseName.includes('1.0 metros') || lowerCaseName.includes('1.0metros')) {
      return 'Media';
    }
    return null;
  };

  return { getCompressionType };
}
