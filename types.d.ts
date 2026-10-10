type Pagination = {
	prevPage: null | number;
	nextPage: null | number;
	perPage: number;
	offset: number;
	total: number;
	currentPage: number;
	totalPages: number;
};

type PaginationParams = {
	limit?: number;
	page?: number;
};
