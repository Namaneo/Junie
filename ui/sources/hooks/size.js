import { useEffect, useState } from 'react';

/**
 * @param {React.MutableRefObject<Element>} element
 * @returns {[width: number, height: number]}
 */
export function useSize(element) {
	const [size, setSize] = useState([0, 0]);

	useEffect(() => {
		const oberser = new ResizeObserver((entries) => {
			const element = entries[0];
			const width = element.contentRect.width;
			const height = element.contentRect.height;

			setSize([width, height]);
		});

		oberser.observe(element.current);

		return () => oberser.disconnect();
	}, []);

	return size;
}
