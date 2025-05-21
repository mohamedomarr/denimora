import { useState, useEffect, useRef } from 'react';

export const useSizeChart = () => {
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const sizeChartRef = useRef(null);
  const sizeChartBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sizeChartRef.current && !sizeChartRef.current.contains(event.target) && 
          sizeChartBtnRef.current && !sizeChartBtnRef.current.contains(event.target)) {
        setIsSizeChartOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const openSizeChart = () => {
    setIsSizeChartOpen(true);
  };

  const closeSizeChart = () => {
    setIsSizeChartOpen(false);
  };

  return {
    isSizeChartOpen,
    sizeChartRef,
    sizeChartBtnRef,
    openSizeChart,
    closeSizeChart
  };
}; 