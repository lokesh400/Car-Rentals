document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.scroll-container');
    const content = container.innerHTML;
    container.innerHTML = content + content;
});