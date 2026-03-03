import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const exportToPDF = async (elementId: string, fileName: string = 'resume.pdf') => {
  const element = document.getElementById(elementId)
  if (!element) return

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    const pageHeight = imgHeight * ratio
    let heightLeft = pageHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, pageHeight)
    heightLeft -= pdfHeight

    while (heightLeft > 0) {
      position = heightLeft - pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, pageHeight)
      heightLeft -= pdfHeight
    }

    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
