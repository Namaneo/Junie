#pragma once

#include_next <sys/socket.h>

#define SO_REUSEADDR 0
#define SO_BROADCAST 0

static int socket(int domain, int type, int protocol) { return -1; }
static int setsockopt(int sockfd, int level, int optname, const void *optval, socklen_t optlen) { return -1; }
static int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen) { return -1; }
static ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen) { return -1; }
static ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags, struct sockaddr *src_addr, socklen_t *addrlen) { return -1; }
