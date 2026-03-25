import { useState } from "react";
import { motion } from "framer-motion";
import { graphNodes, graphEdges } from "@/data/taoData";

const nodeColors = {
  concept: { bg: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))" },
  translation: { bg: "hsl(var(--accent))", text: "hsl(var(--accent-foreground))" },
  translator: { bg: "hsl(var(--jade))", text: "hsl(var(--silk))" },
};

const KnowledgeGraph = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const getNodePos = (id: string) => {
    const node = graphNodes.find((n) => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const isConnected = (nodeId: string) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    return graphEdges.some(
      (e) => (e.from === hoveredNode && e.to === nodeId) || (e.to === hoveredNode && e.from === nodeId)
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg bg-secondary/30">
      <svg viewBox="0 0 750 520" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.4" />
          </marker>
        </defs>

        {/* Edges */}
        {graphEdges.map((edge, i) => {
          const from = getNodePos(edge.from);
          const to = getNodePos(edge.to);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - 15;
          const edgeKey = `${edge.from}-${edge.to}`;
          const isHighlighted = hoveredNode ? (edge.from === hoveredNode || edge.to === hoveredNode) : true;

          return (
            <g key={i} opacity={isHighlighted ? 1 : 0.15}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={hoveredEdge === edgeKey ? 2 : 1}
                strokeOpacity={0.3}
                markerEnd="url(#arrowhead)"
                onMouseEnter={() => setHoveredEdge(edgeKey)}
                onMouseLeave={() => setHoveredEdge(null)}
                className="cursor-pointer"
                strokeLinecap="round"
              />
              {isHighlighted && (
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fontSize="9"
                  fill="hsl(var(--muted-foreground))"
                  fontFamily="DM Sans"
                  opacity={0.7}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {graphNodes.map((node) => {
          const colors = nodeColors[node.type];
          const connected = isConnected(node.id);
          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: connected ? 1 : 0.2, scale: 1 }}
              transition={{ duration: 0.4, delay: Math.random() * 0.3 }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={hoveredNode === node.id ? 32 : 26}
                fill={colors.bg}
                opacity={hoveredNode === node.id ? 1 : 0.85}
                style={{ transition: "all 0.3s ease" }}
              />
              {hoveredNode === node.id && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={38}
                  fill="none"
                  stroke={colors.bg}
                  strokeWidth="1.5"
                  opacity={0.3}
                />
              )}
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={node.type === "concept" ? "10" : "9"}
                fill={colors.text}
                fontFamily={node.type === "concept" ? "Noto Serif SC" : "DM Sans"}
                fontWeight="500"
              >
                {node.label.length > 12 ? node.label.slice(0, 12) + "…" : node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-4 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> Concepto</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent" /> Traducción</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-jade" /> Traductor</span>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
