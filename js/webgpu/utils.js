const getCanvasSize = (canvas) => {
	const devicePixelRatio = window.devicePixelRatio ?? 1;
	return [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio];
};

const loadTexture = async (device, url) => {
	const response = await fetch(url, { credentials: "include" });
	const data = await response.blob();
	const imageBitmap = await createImageBitmap(data);

	const texture = device.createTexture({
		size: [imageBitmap.width, imageBitmap.height, 1],
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
	});

	device.queue.copyExternalImageToTexture(
		{
			source: imageBitmap,
		},
		{
			texture: texture,
		},
		[imageBitmap.width, imageBitmap.height]
	);

	return texture;
};

const createRenderTargetTexture = (device, width, height, format = "rgba8unorm") =>
	device.createTexture({
		size: [width, height, 1],
		format,
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
		// TODO: whittle these down
	});

const loadShaderModule = async (device, url) => {
	const response = await fetch(url);
	const code = await response.text();
	return device.createShaderModule({ code });
};

const makeUniformBuffer = (device, structLayout, values = null) => {
	const buffer = device.createBuffer({
		size: structLayout.size,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		mappedAtCreation: values != null,
	});
	if (values != null) {
		structLayout.build(values, buffer.getMappedRange());
		buffer.unmap();
	}
	return buffer;
};

const makePass = (ready, setSize, getOutputs, execute) => ({
	ready: ready ?? Promise.resolve(),
	setSize: setSize ?? (() => {}),
	getOutputs: getOutputs ?? (() => ({})),
	execute: execute ?? (() => {}),
});

const makePipeline = (context, steps) =>
	steps.filter((f) => f != null).reduce((pipeline, f, i) => [...pipeline, f(context, i == 0 ? null : pipeline[i - 1].getOutputs)], []);

export { getCanvasSize, createRenderTargetTexture, loadTexture, loadShaderModule, makeUniformBuffer, makePass, makePipeline };
