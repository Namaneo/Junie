//Unlock audio context
const unlock = () => {
	if (MTY.audio?.ctx?.state == 'suspended')
		MTY.audio.ctx.resume();
};

window.addEventListener('click', unlock);
window.addEventListener('touchend', unlock);
