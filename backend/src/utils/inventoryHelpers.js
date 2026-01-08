/**
 * inventoryHelpers.js
 * Utilities for unit conversion (Pieces <-> Cartons)
 */

/**
 * Converts a mix of cartons and pieces into total pieces.
 * @param {number} cartons 
 * @param {number} pieces 
 * @param {number} cartonSize 
 * @returns {number} Total pieces
 */
exports.toPieces = (cartons = 0, pieces = 0, cartonSize = 1) => {
    return (Number(cartons) * Number(cartonSize)) + Number(pieces);
};

/**
 * Converts total pieces into cartons and remaining pieces.
 * @param {number} totalPieces 
 * @param {number} cartonSize 
 * @returns {Object} { cartons, pieces }
 */
exports.toCartons = (totalPieces = 0, cartonSize = 1) => {
    const safeSize = cartonSize < 1 ? 1 : cartonSize;
    const cartons = Math.floor(Number(totalPieces) / safeSize);
    const pieces = Number(totalPieces) % safeSize;
    return { cartons, pieces };
};
