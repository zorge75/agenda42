import { useEffect } from 'react';

const useEventOutside = (refs: any, eventType: any, callback: any) => {
	useEffect(() => {
		const handleEvent = (event: any) => {
			// Ensure refs is an array; if not, convert to array or handle single ref
			const refArray = Array.isArray(refs) ? refs : [refs];

			console.log("event.target", event.target);
			console.log("ref.current", refArray);

			const isOutside = refArray.every(
				(ref) => ref && ref.current && !ref.current.contains(event.target)
			);

			if (isOutside) {
				callback(event);
			}
		};

		document.addEventListener(eventType, handleEvent);
		return () => document.removeEventListener(eventType, handleEvent);
	}, [refs, eventType, callback]);
};

export default useEventOutside;