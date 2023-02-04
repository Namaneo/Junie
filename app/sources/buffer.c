#include "buffer.h"

#include <stdlib.h>
#include <string.h>

struct JUN_Buffer
{
	uint32_t length;
	void *buffer;
	void *read_pos;
	void *write_pos;
};

JUN_Buffer *JUN_BufferCreate(uint32_t length)
{
	JUN_Buffer *this = calloc(1, sizeof(JUN_Buffer));

	this->length = length;
	this->buffer = calloc(length, 1);
	this->read_pos = this->buffer;
	this->write_pos = this->buffer;

	return this;
}

static void write(JUN_Buffer *this, const void **position, int32_t length)
{
	uint32_t remaining = (this->buffer + this->length) - this->write_pos;
	memcpy(this->write_pos, *position, length < remaining ? length : remaining);

	this->write_pos = length < remaining
		? this->write_pos + length
		: this->buffer;

	*position += remaining;
	length -= remaining;

	if (length <= 0)
		return;

	memcpy(this->write_pos, *position, length);
	this->write_pos += length;
}

void JUN_BufferWrite(JUN_Buffer *this, const void *data, int32_t length)
{
	const void *position = data;

	int32_t count = 0;
	uint32_t iterations = length / this->length;

	for (size_t i = 0; i < iterations; i++) {
		write(this, &position, this->length);
		length -= this->length;
	}

	if (length <= 0)
		return;

	write(this, &position, length);
}

void JUN_BufferRead(JUN_Buffer *this, void *data, int32_t length)
{
	memset(data, 0, length);

	void *position = data;

	if (length > this->length)
		length = this->length;

	uint32_t remaining = (this->buffer + this->length) - this->read_pos;
	memcpy(position, this->read_pos, length < remaining ? length : remaining);
	memset(this->read_pos, 0, length < remaining ? length : remaining);

	this->read_pos = length < remaining
		? this->read_pos + length
		: this->buffer;

	position += remaining;
	length -= remaining;

	if (length <= 0)
		return;

	memcpy(position, this->read_pos, length);
	memset(this->read_pos, 0, length);
	this->read_pos += length;

	return;
}

void JUN_BufferDestroy(JUN_Buffer **buffer)
{
	if (!buffer || !*buffer)
		return;

	JUN_Buffer *this = *buffer;

	free(this->buffer);

	free(this);
	*buffer = NULL;
}
