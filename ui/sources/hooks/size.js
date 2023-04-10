import { useEffect, useState } from "react";

export function useWindowSize() {
	const [size, setSize] = useState([0, 0]);

	useEffect(() => {
		const updateSize = () => setSize([window.innerWidth, window.innerHeight]);

		window.addEventListener('resize', updateSize);
		updateSize();

		return () => window.removeEventListener('resize', updateSize);
	}, []);

	return size;
}

export function useRefSize(ref) {
	const [size, setSize] = useState([0, 0]);

	useEffect(() => {
		const observer = new ResizeObserver(() => {
			setSize([ref.current.width, ref.current.height]);
		});

		observer.observe(ref.current);

		return () => observer.disconnect();
	}, []);

	return size;
}
