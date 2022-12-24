#include <stdint.h>
#include <string.h>
#include <png.h>

#include "matoya.h"

#include "image.h"

struct data_handle {
	const png_byte *data;
	png_size_t size;
};

struct read_data_handle {
	struct data_handle data;
	png_size_t offset;
};

struct png_info {
	png_uint_32 width;
	png_uint_32 height;
	int color_type;
};

static void read_png_data_callback(png_structp png_ptr, png_byte* raw_data, png_size_t read_length)
{
	struct read_data_handle *handle = png_get_io_ptr(png_ptr);
	const png_byte *png_src = handle->data.data + handle->offset;

	memcpy(raw_data, png_src, read_length);
	handle->offset += read_length;
}

static struct png_info read_and_update_info(png_structp png_ptr, png_infop info_ptr)
{
	png_uint_32 width = 0, height = 0;
	int bit_depth = 0, color_type = 0;

	png_read_info(png_ptr, info_ptr);
	png_get_IHDR(png_ptr, info_ptr, &width, &height, &bit_depth, &color_type, NULL, NULL, NULL);

	if (png_get_valid(png_ptr, info_ptr, PNG_INFO_tRNS))
		png_set_tRNS_to_alpha(png_ptr);

	if (color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8)
		png_set_expand_gray_1_2_4_to_8(png_ptr);

	if (color_type == PNG_COLOR_TYPE_PALETTE)
		png_set_palette_to_rgb(png_ptr);

	if (color_type == PNG_COLOR_TYPE_PALETTE || color_type == PNG_COLOR_TYPE_RGB)
	   png_set_add_alpha(png_ptr, 0xFF, PNG_FILLER_AFTER);

	if (bit_depth < 8) {
	   png_set_packing(png_ptr);

	} else if (bit_depth == 16) {
		png_set_scale_16(png_ptr);
	}

	png_read_update_info(png_ptr, info_ptr);

	color_type = png_get_color_type(png_ptr, info_ptr);

	return (struct png_info) { width, height, color_type };
}

static struct data_handle read_entire_png_image(png_structp png_ptr, png_infop info_ptr, png_uint_32 height)
{
	png_byte *row_ptrs[height];
	png_size_t row_size = png_get_rowbytes(png_ptr, info_ptr);

	int data_length = row_size * height;
	png_byte *raw_image = MTY_Alloc(data_length, 1);

	for (png_uint_32 i = 0; i < height; i++)
		row_ptrs[i] = raw_image + i * row_size;

	png_read_image(png_ptr, &row_ptrs[0]);

	return (struct data_handle) { raw_image, data_length };
}

void *JUN_ImageReadPNG(const void* png_data, int png_data_size, uint32_t *width, uint32_t *height)
{
	png_structp png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
	png_infop info_ptr = png_create_info_struct(png_ptr);

	struct read_data_handle png_data_handle = (struct read_data_handle) { { png_data, png_data_size }, 0 };
	png_set_read_fn(png_ptr, &png_data_handle, read_png_data_callback);

	setjmp(png_jmpbuf(png_ptr));

	struct png_info png_info = read_and_update_info(png_ptr, info_ptr);
	struct data_handle raw_image = read_entire_png_image(png_ptr, info_ptr, png_info.height);

	png_read_end(png_ptr, info_ptr);
	png_destroy_read_struct(&png_ptr, &info_ptr, NULL);

	*width = png_info.width;
	*height = png_info.height;

	return (void *) raw_image.data;
}
