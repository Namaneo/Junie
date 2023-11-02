#include "interop.h"

#include <stdlib.h>

#define IMPORT(name) __attribute__((import_module("env"), import_name(#name))) name
void IMPORT(web_video)(const JunieVideo *video);
void IMPORT(web_audio)(const JunieAudio *audio);
void IMPORT(web_variables)(const JunieVariable *variables);

void JunieInteropInit(JunieSymbols *sym)
{
	#define MAP_SYMBOL(function) sym->function = function

	MAP_SYMBOL(retro_init);
	MAP_SYMBOL(retro_load_game);
	MAP_SYMBOL(retro_get_system_info);
	MAP_SYMBOL(retro_get_system_av_info);
	MAP_SYMBOL(retro_set_environment);
	MAP_SYMBOL(retro_set_video_refresh);
	MAP_SYMBOL(retro_set_input_poll);
	MAP_SYMBOL(retro_set_input_state);
	MAP_SYMBOL(retro_set_audio_sample);
	MAP_SYMBOL(retro_set_audio_sample_batch);
	MAP_SYMBOL(retro_set_controller_port_device);
	MAP_SYMBOL(retro_get_memory_size);
	MAP_SYMBOL(retro_get_memory_data);
	MAP_SYMBOL(retro_serialize_size);
	MAP_SYMBOL(retro_serialize);
	MAP_SYMBOL(retro_unserialize);
	MAP_SYMBOL(retro_cheat_reset);
	MAP_SYMBOL(retro_cheat_set);
	MAP_SYMBOL(retro_run);
	MAP_SYMBOL(retro_reset);
	MAP_SYMBOL(retro_unload_game);
	MAP_SYMBOL(retro_deinit);

	#undef MAP_SYMBOL
}

void JunieInteropVideo(const JunieVideo *video)
{
	web_video(video);
}

void JunieInteropAudio(const JunieAudio *audio)
{
	web_audio(audio);
}

void JunieInteropVariables(const JunieVariable *variables)
{
	web_variables(variables);
}


// socket.h

#include <sys/socket.h>

int socket(int domain, int type, int protocol) { return -1; }
int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen) { return -1; }
int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen) { return -1; }
ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen) { return -1; }
ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags, struct sockaddr *src_addr, socklen_t *addrlen) { return -1; }


// thread.h

#include <pthread.h>

int pthread_attr_setschedpolicy(pthread_attr_t *attr, int policy) { return -1; }
int pthread_attr_setschedparam(pthread_attr_t *attr, const struct sched_param *param) { return -1; }


// setjmp.h

#include <setjmp.h>

int setjmp(jmp_buf env) { return 0; }
void longjmp(jmp_buf env, int val) { abort(); }


// mman.h

#include <sys/mman.h>

int madvise(void *addr, size_t length, int advice) { return 0; }


// WASI

void *__cxa_allocate_exception(size_t thrown_size) { abort(); }
void __cxa_throw(void *thrown_object, void *tinfo, void (*dest)(void *)) { abort(); }
