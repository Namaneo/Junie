#include <stdlib.h>


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


// signal.h

#include <signal.h>

int sigemptyset(sigset_t *set) { return -1; }
int sigaltstack(const stack_t *ss, stack_t *old_ss) { return -1; }
int sigaction(int signum, const struct sigaction *act, struct sigaction *oldact) { return -1; }

// WASI

void *__cxa_allocate_exception(size_t thrown_size) { abort(); }
void __cxa_throw(void *thrown_object, void *tinfo, void (*dest)(void *)) { abort(); }
