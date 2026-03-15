import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ShowcasePdfExportProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

const ShowcasePdfExport = ({ contentRef }: ShowcasePdfExportProps) => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    if (!contentRef.current) return;
    setGenerating(true);

    try {
      // Temporarily expand content for capture
      const el = contentRef.current;
      const origOverflow = el.style.overflow;
      el.style.overflow = "visible";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#141824",
        logging: false,
        windowWidth: 1200,
      });

      el.style.overflow = origOverflow;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // Add branded header to first page
      pdf.setFillColor(20, 24, 36);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < imgHeight) {
        if (pageNum > 0) {
          pdf.addPage();
          pdf.setFillColor(20, 24, 36);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
        }

        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sourceH = Math.min(
          ((pageHeight - margin * 2) / imgHeight) * canvas.height,
          canvas.height - sourceY
        );
        const destH = (sourceH / canvas.height) * imgHeight;

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceH;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceH,
            0, 0, canvas.width, sourceH
          );
          const pageImgData = pageCanvas.toDataURL("image/png");
          pdf.addImage(pageImgData, "PNG", margin, margin, contentWidth, destH);
        }

        // Footer
        pdf.setFontSize(7);
        pdf.setTextColor(120, 130, 160);
        pdf.text(
          `AfricaOne Credit Intelligence Platform • Confidential • Page ${pageNum + 1}`,
          pageWidth / 2,
          pageHeight - 4,
          { align: "center" }
        );

        yOffset += pageHeight - margin * 2;
        pageNum++;
      }

      pdf.save("AfricaOne-Platform-Showcase.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePdf}
      disabled={generating}
      variant="outline"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
};

export default ShowcasePdfExport;
