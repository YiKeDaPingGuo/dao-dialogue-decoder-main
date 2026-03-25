import { motion, AnimatePresence } from "framer-motion";
import { mbtiData } from "@/data/taoData";
import { X } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EnlightenmentReport = ({ isOpen, onClose }: Props) => {
  const radarData = mbtiData.dimensions.map((d) => ({
    subject: d.axis,
    value: d.value,
    fullMark: 100,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="font-display text-2xl text-foreground mb-1">
                Informe de Iluminación
              </h2>
              <p className="text-sm text-muted-foreground font-body">
                Análisis psicolingüístico de tu recorrido contemplativo
              </p>
            </div>

            {/* MBTI Card */}
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="flex-1 bg-secondary/50 rounded-xl p-5 text-center">
                <span className="text-xs font-body uppercase tracking-widest text-muted-foreground">Perfil MBTI</span>
                <div className="text-5xl font-display font-bold text-primary mt-2">{mbtiData.type}</div>
                <span className="text-sm text-muted-foreground font-body">{mbtiData.label}</span>
              </div>
              <div className="flex-1 bg-secondary/50 rounded-xl p-5 text-center">
                <span className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                  Alineación Wu Wei
                </span>
                <div className="text-5xl font-display font-bold text-accent mt-2">{mbtiData.wuWeiAlignment}%</div>
                <span className="text-sm text-muted-foreground font-body">无为 · No-acción</span>
              </div>
            </div>

            {/* Radar chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "DM Sans" }}
                  />
                  <Radar
                    name="Perfil"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension bars */}
            <div className="space-y-2 mt-4">
              {mbtiData.dimensions.map((dim) => (
                <div key={dim.axis} className="flex items-center gap-3 text-sm font-body">
                  <span className="w-36 text-right text-muted-foreground truncate">{dim.axis}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dim.value}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <span className="w-10 text-right text-foreground font-medium">{dim.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnlightenmentReport;
