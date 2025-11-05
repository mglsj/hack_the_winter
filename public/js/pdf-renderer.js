// PDF.js setup and rendering
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function renderPDF(canvasId, pdfUrl) {
    try {
        console.log('Rendering PDF:', canvasId, pdfUrl);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        
        const context = canvas.getContext('2d');
        
        // Load PDF
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        console.log('PDF loaded, pages:', pdf.numPages);
        
        const page = await pdf.getPage(1); // Get first page
        console.log('Page loaded');
        
        // Get container dimensions
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        console.log('Container dimensions:', containerWidth, containerHeight);
        
        // Calculate scale to fit container
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY) * 0.8; // 0.8 for padding
        
        const scaledViewport = page.getViewport({ scale });
        
        console.log('Viewport:', scaledViewport.width, scaledViewport.height, 'Scale:', scale);
        
        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.width = scaledViewport.width + 'px';
        canvas.style.height = scaledViewport.height + 'px';
        
        // Clear canvas with white background first
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render the page
        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;
        
        // Hide loading text
        const loadingText = canvas.parentElement.querySelector('.loading-text');
        if (loadingText) {
            loadingText.style.display = 'none';
        }
        
        console.log('PDF rendered successfully');
        
    } catch (error) {
        console.error('Error rendering PDF:', error);
        
        // Show error message on canvas
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#000000';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.fillText('Error loading PDF', canvas.width / 2, canvas.height / 2);
        }
    }
}

// Make function globally available
window.renderPDF = renderPDF;