import React, { useState, useEffect } from 'react';

const Pagination = ({
	totalItems,
	itemsPerPage,
	currentPage,
	onPageChange,
	maxPageButtons = 3,
}: {
	totalItems: number;
	itemsPerPage: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	maxPageButtons?: number;
}) => {
	const [pageNumbers, setPageNumbers] = useState<number[]>([]);
	const totalPages = Math.ceil(totalItems / itemsPerPage);

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	useEffect(() => {
		let pages = [];

		if (totalPages <= maxPageButtons) {
			pages = Array.from({ length: totalPages }, (_, i) => i + 1);
		} else {
			if (currentPage <= Math.ceil(maxPageButtons / 2)) {
				pages = Array.from({ length: maxPageButtons }, (_, i) => i + 1);
			} else if (currentPage > totalPages - Math.floor(maxPageButtons / 2)) {
				const startPage = totalPages - maxPageButtons + 1;
				pages = Array.from({ length: maxPageButtons }, (_, i) => startPage + i);
			} else {
				const offset = Math.floor(maxPageButtons / 2);
				const startPage = currentPage - offset;
				pages = Array.from({ length: maxPageButtons }, (_, i) => startPage + i);
			}
		}

		setPageNumbers(pages);
	}, [currentPage, totalPages, maxPageButtons]);

	return (
		<div className='flex items-center justify-between mt-6'>
			<div className='text-base text-[#001540]'>
				{totalItems > 0 ? (
					<>
						<span className='font-medium'>{startItem}</span>
						<span> - </span>
						<span className='font-medium'>{endItem}</span>
						<span> of </span>
						<span className='font-medium'>{totalItems}</span>
					</>
				) : (
					<span>No items</span>
				)}
			</div>

			<div className='flex items-center space-x-2 h-[34px]'>
				{/* Previous page button */}
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className={` h-full w-[32px] py-1 text-sm rounded ${
						currentPage === 1
							? 'bg-white  cursor-not-allowed'
							: 'bg-primary hover:bg-[#bfdd60]'
					}`}
				/>

				{/* Page number buttons */}
				{pageNumbers.map((number) => (
					<button
						key={number}
						onClick={() => onPageChange(number)}
						className={`h-full w-[32px] flex items-center justify-center text-primary-black text-sm rounded ${
							currentPage === number ? 'bg-primary ' : 'bg-white hover:bg-gray-500'
						}`}>
						{number}
					</button>
				))}

				{/* Next page button */}
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className={`h-full w-[32px]  rounded ${
						currentPage === totalPages
							? 'bg-white cursor-not-allowed'
							: 'bg-primary hover:bg-[#bfdd60]'
					}`}
				/>
			</div>
		</div>
	);
};

export default Pagination;
