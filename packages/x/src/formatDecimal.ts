export const formatDecimal = (value: number | null | undefined, precision: number) => {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return '';
	}

	return value.toFixed(precision).toString();
};
