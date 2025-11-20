import { useState, useEffect } from 'react';

type FontSize = 'small' | 'normal' | 'large' | 'extra-large';

export const useAccessibility = () => {
  const [fontSize, setFontSize] = useState<FontSize>('normal');

  useEffect(() => {
    // Carregar configuração salva do localStorage
    const savedFontSize = localStorage.getItem('accessibility-font-size') as FontSize;
    if (savedFontSize) {
      setFontSize(savedFontSize);
      applyFontSize(savedFontSize);
    }
  }, []);

  const applyFontSize = (size: FontSize) => {
    // Remove classes anteriores
    document.documentElement.classList.remove(
      'font-size-small',
      'font-size-normal', 
      'font-size-large',
      'font-size-extra-large'
    );
    
    // Adiciona nova classe
    document.documentElement.classList.add(`font-size-${size}`);
  };

  const changeFontSize = (newSize: FontSize) => {
    setFontSize(newSize);
    applyFontSize(newSize);
    localStorage.setItem('accessibility-font-size', newSize);
  };

  const increaseFontSize = () => {
    const sizes: FontSize[] = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    changeFontSize(sizes[nextIndex]);
  };

  const decreaseFontSize = () => {
    const sizes: FontSize[] = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = Math.max(currentIndex - 1, 0);
    changeFontSize(sizes[nextIndex]);
  };

  const resetFontSize = () => {
    changeFontSize('normal');
  };

  return {
    fontSize,
    changeFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  };
};