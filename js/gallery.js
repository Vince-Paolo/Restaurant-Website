document.addEventListener('DOMContentLoaded', () => {
    // Image Modal / Lightbox
    const galleryImages = document.querySelectorAll('.gallery-grid img');
    
    if (galleryImages.length > 0) {
        // Create Modal Elements dynamically
        const modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.classList.add('hidden');
        
        const modalImg = document.createElement('img');
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'close-modal';

        modal.appendChild(closeBtn);
        modal.appendChild(modalImg);
        document.body.appendChild(modal);

        // Open Modal on Image Click
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                modalImg.src = img.src;
                modal.classList.remove('hidden');
                modal.classList.add('modal-visible');
            });
        });

        // Close Modal
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('modal-visible');
        });

        // Close Modal when clicking outside the image
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('modal-visible');
            }
        });
    }
});