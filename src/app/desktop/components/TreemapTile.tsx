'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import Tile from './Tile';
import PillButton from '../../components/PillButton';
import treemapData from './TreemapData.json';
import { ChevronDownIcon } from '../../components/icons/ChevronDownIcon';

interface TreemapTileProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDarkMode?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, handle: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
}

interface TreemapNode {
  name: string;
  value: number;
  change: number;
  volume: number;
}

interface HierarchyNode extends d3.HierarchyRectangularNode<TreemapNode> {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  data: TreemapNode;
}

export default function TreemapTile({
  id,
  x,
  y,
  width,
  height,
  isDarkMode,
  onMouseDown,
  onResizeStart,
  isDragging,
  isResizing,
}: TreemapTileProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'Change' | 'Volume'>('Change');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Calculate treemap layout following Observable squarify example
  const treemapLayout = useMemo(() => {
    // Chart dimensions (accounting for padding)
    const chartWidth = Math.max(100, width - 60);
    const chartHeight = Math.max(100, height - 90);

    // Convert data based on selected metric
    const dataWithValues = {
      ...treemapData,
      children: treemapData.children.map(child => ({
        ...child,
        // Use the selected metric for sizing
        value: selectedMetric === 'Change' 
          ? Math.abs(child.change) || 0.1  // Use absolute value of change
          : child.volume / 1000000 || 0.1, // Use volume (scaled down)
      }))
    };

    // Create hierarchy and sort by value (descending) as in Observable example
    const hierarchy = d3.hierarchy(dataWithValues)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap generator exactly as in Observable squarify example
    const treeGenerator = d3.treemap<TreemapNode>()
      .tile(d3.treemapSquarify)  // Use squarify tiling method
      .size([chartWidth, chartHeight])
      .padding(2)  // Slight uniform padding between tiles
      .round(true);  // Round coordinates for pixel-perfect rendering

    // Generate layout
    return treeGenerator(hierarchy);
  }, [width, height, selectedMetric]);

  // Get color based on change value (always use change for color)
  const getColor = (change: number) => {
    if (change > 0) {
      // Green for positive - scale intensity based on value
      const intensity = Math.min(Math.abs(change) / 10, 1);
      return `rgba(0, ${Math.floor(180 + 75 * intensity)}, 0, ${0.7 + 0.3 * intensity})`;
    } else if (change < 0) {
      // Red for negative - scale intensity based on value
      const intensity = Math.min(Math.abs(change) / 10, 1);
      return `rgba(${Math.floor(180 + 75 * intensity)}, 0, 0, ${0.7 + 0.3 * intensity})`;
    }
    return 'rgba(128, 128, 128, 0.8)'; // Gray for zero
  };

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <Tile
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      isDarkMode={isDarkMode}
      onMouseDown={onMouseDown}
      onResizeStart={onResizeStart}
      isDragging={isDragging}
      isResizing={isResizing}
    >
      {/* Tile content */}
      <div className="h-full">
        <h1 
          className="text-white font-semibold"
          style={{ 
            fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
            fontSize: '28px',
            position: 'absolute',
            top: '15px',
            left: '30px',
          }}
        >
          Sector Performance
        </h1>

        {/* Dropdown button in top right */}
        <div 
          ref={dropdownRef}
          style={{ 
            position: 'absolute',
            top: '15px',
            right: '30px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                cursor: 'pointer',
              }}
            >
                <PillButton
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedMetric}
                    <span
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronDownIcon size="sm" className="text-white opacity-85" />
                    </span>
                  </span>
                }
                isSelected={false}
                onClick={() => {}}
              />
            </div>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'rgba(217, 217, 217, 0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  padding: '8px',
                  minWidth: '120px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000,
                }}
              >
                {['Change', 'Volume'].map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedMetric(option as 'Change' | 'Volume');
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      backgroundColor: selectedMetric === option ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMetric !== option) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMetric !== option) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Treemap chart area */}
        <div 
          style={{ 
            position: 'absolute',
            top: '60px',
            left: '30px',
            right: '30px',
            bottom: '30px',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <svg 
            width={width - 60} 
            height={height - 90}
            style={{ display: 'block' }}
          >
            {treemapLayout.leaves().map((leaf: HierarchyNode) => {
              const isHovered = hoveredNode === leaf.data.name;
              const rectWidth = leaf.x1 - leaf.x0;
              const rectHeight = leaf.y1 - leaf.y0;
              
              return (
                <g 
                  key={leaf.data.name}
                  onMouseEnter={() => setHoveredNode(leaf.data.name)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={leaf.x0}
                    y={leaf.y0}
                    width={rectWidth}
                    height={rectHeight}
                    fill={getColor(leaf.data.change)}
                    stroke="none"
                    rx={4}
                    ry={4}
                    style={{
                      transition: 'all 0.2s ease',
                      opacity: isHovered ? 1 : 0.9,
                    }}
                  />
                  {/* Sector name */}
                  {rectWidth > 60 && rectHeight > 40 && (
                    <>
                      <text
                        x={leaf.x0 + rectWidth / 2}
                        y={leaf.y0 + rectHeight / 2 - 8}
                        textAnchor="middle"
                        style={{
                          fill: '#FFFFFF',
                          fontSize: rectWidth > 100 ? '14px' : '11px',
                          fontWeight: 600,
                          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                          pointerEvents: 'none',
                          textShadow: '0px 1px 3px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {leaf.data.name}
                      </text>
                      {/* Display metric value based on selection */}
                      <text
                        x={leaf.x0 + rectWidth / 2}
                        y={leaf.y0 + rectHeight / 2 + 12}
                        textAnchor="middle"
                        style={{
                          fill: '#FFFFFF',
                          fontSize: rectWidth > 100 ? '16px' : '13px',
                          fontWeight: 700,
                          fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                          pointerEvents: 'none',
                          textShadow: '0px 1px 3px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {selectedMetric === 'Change' 
                          ? `${leaf.data.change > 0 ? '+' : ''}${leaf.data.change.toFixed(1)}%`
                          : formatVolume(leaf.data.volume)
                        }
                      </text>
                    </>
                  )}
                  {/* Show abbreviated text for smaller tiles */}
                  {rectWidth > 40 && rectHeight > 30 && rectWidth <= 60 && (
                    <text
                      x={leaf.x0 + rectWidth / 2}
                      y={leaf.y0 + rectHeight / 2 + 4}
                      textAnchor="middle"
                      style={{
                        fill: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: 'SF Pro Rounded, system-ui, -apple-system, sans-serif',
                        pointerEvents: 'none',
                        textShadow: '0px 1px 3px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {selectedMetric === 'Change' 
                        ? `${leaf.data.change > 0 ? '+' : ''}${leaf.data.change.toFixed(1)}%`
                        : formatVolume(leaf.data.volume)
                      }
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Tile>
  );
}

