#pragma once

#define SOCK_DGRAM 0
#define SOL_SOCKET 0
#define SO_REUSEADDR 0
#define SO_BROADCAST 0

#define socket(...) -1
#define setsockopt(...) -1
#define bind(...) -1
#define sendto(...) -1
#define recvfrom(...) -1

struct sockaddr {
	unsigned short sa_family;
	char sa_data[14];
};

typedef int socklen_t;
