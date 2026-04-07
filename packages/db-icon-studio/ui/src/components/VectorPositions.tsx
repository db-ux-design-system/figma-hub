/**
 * VectorPositions Component
 *
 * Displays position information for all vectors in the master icon template
 */

import type { VectorPositionInfo } from "../types";

interface VectorPositionsProps {
  vectors: VectorPositionInfo[];
}

export function VectorPositions({ vectors }: VectorPositionsProps) {
  if (!vectors || vectors.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Vector Positions ({vectors.length})
      </h3>

      <div className="space-y-3">
        {vectors.map((vector, index) => (
          <div
            key={index}
            className="p-3 bg-white rounded border border-gray-200 text-xs"
          >
            <div className="font-medium text-gray-900 mb-2 flex items-center justify-between">
              <span>{vector.name}</span>
              {vector.strokeWeight ? (
                <span className="text-gray-500 font-normal">
                  {vector.strokeWeight}px stroke
                </span>
              ) : (
                <span className="text-blue-500 font-normal text-xs">
                  fill only
                </span>
              )}
            </div>

            {/* Layer Path */}
            {vector.layerPath && vector.layerPath.length > 0 && (
              <div className="mb-2 text-gray-600 text-xs">
                <span className="text-gray-500">Layer:</span>{" "}
                {vector.layerPath.join(" › ")} ›{" "}
                <span className="font-medium">{vector.name}</span>
              </div>
            )}

            {vector.isInFrame && vector.parentFrameName && (
              <div className="mb-2 text-blue-600 italic text-xs">
                ⚠️ in nested Frame: {vector.parentFrameName}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-500">Relative:</span> x=
                {vector.relativeX.toFixed(2)}, y={vector.relativeY.toFixed(2)}
              </div>
              <div>
                <span className="text-gray-500">Absolute:</span> x=
                {vector.x.toFixed(2)}, y={vector.y.toFixed(2)}
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Size:</span>{" "}
                {vector.width.toFixed(2)} × {vector.height.toFixed(2)}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-gray-500 mb-1">Distance from edges:</div>
              <div className="grid grid-cols-2 gap-1">
                <div
                  className={getDistanceClass(vector.distanceFromEdges.left)}
                >
                  ← {vector.distanceFromEdges.left.toFixed(2)}px
                </div>
                <div className={getDistanceClass(vector.distanceFromEdges.top)}>
                  ↑ {vector.distanceFromEdges.top.toFixed(2)}px
                </div>
                <div
                  className={getDistanceClass(vector.distanceFromEdges.right)}
                >
                  → {vector.distanceFromEdges.right.toFixed(2)}px
                </div>
                <div
                  className={getDistanceClass(vector.distanceFromEdges.bottom)}
                >
                  ↓ {vector.distanceFromEdges.bottom.toFixed(2)}px
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Get CSS class based on distance from edge
 * Red if < 3px, yellow if < 5px, green otherwise
 */
function getDistanceClass(distance: number): string {
  const baseClass = "px-2 py-1 rounded";

  if (distance < 3) {
    return `${baseClass} bg-red-100 text-red-700`;
  } else if (distance < 5) {
    return `${baseClass} bg-yellow-100 text-yellow-700`;
  } else {
    return `${baseClass} bg-green-100 text-green-700`;
  }
}
