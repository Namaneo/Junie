#include "graphics.h"

#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

#include <EGL/egl.h>
#include <GLES2/gl2.h>

typedef void (*GLFunc)(void);

EGLDisplay eglGetDisplay (EGLNativeDisplayType display_id)
{
	return (void *) 1;
}

const char *eglQueryString(EGLDisplay dpy, EGLint name)
{
	switch (name) {
		case EGL_CLIENT_APIS: return "OpenGL_ES";
		case EGL_VENDOR:      return "Junie";
		case EGL_VERSION:     return "1.0";
		case EGL_EXTENSIONS:  return "";
	}
	return NULL;
}

EGLBoolean eglInitialize(EGLDisplay dpy, EGLint *major, EGLint *minor)
{
	*major = 1;
	*minor = 0;

	return true;
}

GLFunc eglGetProcAddress(const char *procname)
{
	if (!strcmp("glActiveTexture",                       procname)) return (GLFunc) glActiveTexture;
	if (!strcmp("glAttachShader",                        procname)) return (GLFunc) glAttachShader;
	if (!strcmp("glBindAttribLocation",                  procname)) return (GLFunc) glBindAttribLocation;
	if (!strcmp("glBindBuffer",                          procname)) return (GLFunc) glBindBuffer;
	if (!strcmp("glBindFramebuffer",                     procname)) return (GLFunc) glBindFramebuffer;
	if (!strcmp("glBindRenderbuffer",                    procname)) return (GLFunc) glBindRenderbuffer;
	if (!strcmp("glBindTexture",                         procname)) return (GLFunc) glBindTexture;
	if (!strcmp("glBlendColor",                          procname)) return (GLFunc) glBlendColor;
	if (!strcmp("glBlendEquation",                       procname)) return (GLFunc) glBlendEquation;
	if (!strcmp("glBlendEquationSeparate",               procname)) return (GLFunc) glBlendEquationSeparate;
	if (!strcmp("glBlendFunc",                           procname)) return (GLFunc) glBlendFunc;
	if (!strcmp("glBlendFuncSeparate",                   procname)) return (GLFunc) glBlendFuncSeparate;
	if (!strcmp("glBufferData",                          procname)) return (GLFunc) glBufferData;
	if (!strcmp("glBufferSubData",                       procname)) return (GLFunc) glBufferSubData;
	if (!strcmp("glCheckFramebufferStatus",              procname)) return (GLFunc) glCheckFramebufferStatus;
	if (!strcmp("glClear",                               procname)) return (GLFunc) glClear;
	if (!strcmp("glClearColor",                          procname)) return (GLFunc) glClearColor;
	if (!strcmp("glClearDepthf",                         procname)) return (GLFunc) glClearDepthf;
	if (!strcmp("glClearStencil",                        procname)) return (GLFunc) glClearStencil;
	if (!strcmp("glColorMask",                           procname)) return (GLFunc) glColorMask;
	if (!strcmp("glCompileShader",                       procname)) return (GLFunc) glCompileShader;
	if (!strcmp("glCompressedTexImage2D",                procname)) return (GLFunc) glCompressedTexImage2D;
	if (!strcmp("glCompressedTexSubImage2D",             procname)) return (GLFunc) glCompressedTexSubImage2D;
	if (!strcmp("glCopyTexImage2D",                      procname)) return (GLFunc) glCopyTexImage2D;
	if (!strcmp("glCopyTexSubImage2D",                   procname)) return (GLFunc) glCopyTexSubImage2D;
	if (!strcmp("glCreateProgram",                       procname)) return (GLFunc) glCreateProgram;
	if (!strcmp("glCreateShader",                        procname)) return (GLFunc) glCreateShader;
	if (!strcmp("glCullFace",                            procname)) return (GLFunc) glCullFace;
	if (!strcmp("glDeleteBuffers",                       procname)) return (GLFunc) glDeleteBuffers;
	if (!strcmp("glDeleteFramebuffers",                  procname)) return (GLFunc) glDeleteFramebuffers;
	if (!strcmp("glDeleteProgram",                       procname)) return (GLFunc) glDeleteProgram;
	if (!strcmp("glDeleteRenderbuffers",                 procname)) return (GLFunc) glDeleteRenderbuffers;
	if (!strcmp("glDeleteShader",                        procname)) return (GLFunc) glDeleteShader;
	if (!strcmp("glDeleteTextures",                      procname)) return (GLFunc) glDeleteTextures;
	if (!strcmp("glDepthFunc",                           procname)) return (GLFunc) glDepthFunc;
	if (!strcmp("glDepthMask",                           procname)) return (GLFunc) glDepthMask;
	if (!strcmp("glDepthRangef",                         procname)) return (GLFunc) glDepthRangef;
	if (!strcmp("glDetachShader",                        procname)) return (GLFunc) glDetachShader;
	if (!strcmp("glDisable",                             procname)) return (GLFunc) glDisable;
	if (!strcmp("glDisableVertexAttribArray",            procname)) return (GLFunc) glDisableVertexAttribArray;
	if (!strcmp("glDrawArrays",                          procname)) return (GLFunc) glDrawArrays;
	if (!strcmp("glDrawElements",                        procname)) return (GLFunc) glDrawElements;
	if (!strcmp("glEnable",                              procname)) return (GLFunc) glEnable;
	if (!strcmp("glEnableVertexAttribArray",             procname)) return (GLFunc) glEnableVertexAttribArray;
	if (!strcmp("glFinish",                              procname)) return (GLFunc) glFinish;
	if (!strcmp("glFlush",                               procname)) return (GLFunc) glFlush;
	if (!strcmp("glFramebufferRenderbuffer",             procname)) return (GLFunc) glFramebufferRenderbuffer;
	if (!strcmp("glFramebufferTexture2D",                procname)) return (GLFunc) glFramebufferTexture2D;
	if (!strcmp("glFrontFace",                           procname)) return (GLFunc) glFrontFace;
	if (!strcmp("glGenBuffers",                          procname)) return (GLFunc) glGenBuffers;
	if (!strcmp("glGenerateMipmap",                      procname)) return (GLFunc) glGenerateMipmap;
	if (!strcmp("glGenFramebuffers",                     procname)) return (GLFunc) glGenFramebuffers;
	if (!strcmp("glGenRenderbuffers",                    procname)) return (GLFunc) glGenRenderbuffers;
	if (!strcmp("glGenTextures",                         procname)) return (GLFunc) glGenTextures;
	if (!strcmp("glGetActiveAttrib",                     procname)) return (GLFunc) glGetActiveAttrib;
	if (!strcmp("glGetActiveUniform",                    procname)) return (GLFunc) glGetActiveUniform;
	if (!strcmp("glGetAttachedShaders",                  procname)) return (GLFunc) glGetAttachedShaders;
	if (!strcmp("glGetAttribLocation",                   procname)) return (GLFunc) glGetAttribLocation;
	if (!strcmp("glGetBooleanv",                         procname)) return (GLFunc) glGetBooleanv;
	if (!strcmp("glGetBufferParameteriv",                procname)) return (GLFunc) glGetBufferParameteriv;
	if (!strcmp("glGetError",                            procname)) return (GLFunc) glGetError;
	if (!strcmp("glGetFloatv",                           procname)) return (GLFunc) glGetFloatv;
	if (!strcmp("glGetFramebufferAttachmentParameteriv", procname)) return (GLFunc) glGetFramebufferAttachmentParameteriv;
	if (!strcmp("glGetIntegerv",                         procname)) return (GLFunc) glGetIntegerv;
	if (!strcmp("glGetProgramiv",                        procname)) return (GLFunc) glGetProgramiv;
	if (!strcmp("glGetProgramInfoLog",                   procname)) return (GLFunc) glGetProgramInfoLog;
	if (!strcmp("glGetRenderbufferParameteriv",          procname)) return (GLFunc) glGetRenderbufferParameteriv;
	if (!strcmp("glGetShaderiv",                         procname)) return (GLFunc) glGetShaderiv;
	if (!strcmp("glGetShaderInfoLog",                    procname)) return (GLFunc) glGetShaderInfoLog;
	if (!strcmp("glGetShaderPrecisionFormat",            procname)) return (GLFunc) glGetShaderPrecisionFormat;
	if (!strcmp("glGetShaderSource",                     procname)) return (GLFunc) glGetShaderSource;
	if (!strcmp("glGetString",                           procname)) return (GLFunc) glGetString;
	if (!strcmp("glGetTexParameterfv",                   procname)) return (GLFunc) glGetTexParameterfv;
	if (!strcmp("glGetTexParameteriv",                   procname)) return (GLFunc) glGetTexParameteriv;
	if (!strcmp("glGetUniformfv",                        procname)) return (GLFunc) glGetUniformfv;
	if (!strcmp("glGetUniformiv",                        procname)) return (GLFunc) glGetUniformiv;
	if (!strcmp("glGetUniformLocation",                  procname)) return (GLFunc) glGetUniformLocation;
	if (!strcmp("glGetVertexAttribfv",                   procname)) return (GLFunc) glGetVertexAttribfv;
	if (!strcmp("glGetVertexAttribiv",                   procname)) return (GLFunc) glGetVertexAttribiv;
	if (!strcmp("glGetVertexAttribPointerv",             procname)) return (GLFunc) glGetVertexAttribPointerv;
	if (!strcmp("glHint",                                procname)) return (GLFunc) glHint;
	if (!strcmp("glIsBuffer",                            procname)) return (GLFunc) glIsBuffer;
	if (!strcmp("glIsEnabled",                           procname)) return (GLFunc) glIsEnabled;
	if (!strcmp("glIsFramebuffer",                       procname)) return (GLFunc) glIsFramebuffer;
	if (!strcmp("glIsProgram",                           procname)) return (GLFunc) glIsProgram;
	if (!strcmp("glIsRenderbuffer",                      procname)) return (GLFunc) glIsRenderbuffer;
	if (!strcmp("glIsShader",                            procname)) return (GLFunc) glIsShader;
	if (!strcmp("glIsTexture",                           procname)) return (GLFunc) glIsTexture;
	if (!strcmp("glLineWidth",                           procname)) return (GLFunc) glLineWidth;
	if (!strcmp("glLinkProgram",                         procname)) return (GLFunc) glLinkProgram;
	if (!strcmp("glPixelStorei",                         procname)) return (GLFunc) glPixelStorei;
	if (!strcmp("glPolygonOffset",                       procname)) return (GLFunc) glPolygonOffset;
	if (!strcmp("glReadPixels",                          procname)) return (GLFunc) glReadPixels;
	if (!strcmp("glReleaseShaderCompiler",               procname)) return (GLFunc) glReleaseShaderCompiler;
	if (!strcmp("glRenderbufferStorage",                 procname)) return (GLFunc) glRenderbufferStorage;
	if (!strcmp("glSampleCoverage",                      procname)) return (GLFunc) glSampleCoverage;
	if (!strcmp("glScissor",                             procname)) return (GLFunc) glScissor;
	if (!strcmp("glShaderBinary",                        procname)) return (GLFunc) glShaderBinary;
	if (!strcmp("glShaderSource",                        procname)) return (GLFunc) glShaderSource;
	if (!strcmp("glStencilFunc",                         procname)) return (GLFunc) glStencilFunc;
	if (!strcmp("glStencilFuncSeparate",                 procname)) return (GLFunc) glStencilFuncSeparate;
	if (!strcmp("glStencilMask",                         procname)) return (GLFunc) glStencilMask;
	if (!strcmp("glStencilMaskSeparate",                 procname)) return (GLFunc) glStencilMaskSeparate;
	if (!strcmp("glStencilOp",                           procname)) return (GLFunc) glStencilOp;
	if (!strcmp("glStencilOpSeparate",                   procname)) return (GLFunc) glStencilOpSeparate;
	if (!strcmp("glTexImage2D",                          procname)) return (GLFunc) glTexImage2D;
	if (!strcmp("glTexParameterf",                       procname)) return (GLFunc) glTexParameterf;
	if (!strcmp("glTexParameterfv",                      procname)) return (GLFunc) glTexParameterfv;
	if (!strcmp("glTexParameteri",                       procname)) return (GLFunc) glTexParameteri;
	if (!strcmp("glTexParameteriv",                      procname)) return (GLFunc) glTexParameteriv;
	if (!strcmp("glTexSubImage2D",                       procname)) return (GLFunc) glTexSubImage2D;
	if (!strcmp("glUniform1f",                           procname)) return (GLFunc) glUniform1f;
	if (!strcmp("glUniform1fv",                          procname)) return (GLFunc) glUniform1fv;
	if (!strcmp("glUniform1i",                           procname)) return (GLFunc) glUniform1i;
	if (!strcmp("glUniform1iv",                          procname)) return (GLFunc) glUniform1iv;
	if (!strcmp("glUniform2f",                           procname)) return (GLFunc) glUniform2f;
	if (!strcmp("glUniform2fv",                          procname)) return (GLFunc) glUniform2fv;
	if (!strcmp("glUniform2i",                           procname)) return (GLFunc) glUniform2i;
	if (!strcmp("glUniform2iv",                          procname)) return (GLFunc) glUniform2iv;
	if (!strcmp("glUniform3f",                           procname)) return (GLFunc) glUniform3f;
	if (!strcmp("glUniform3fv",                          procname)) return (GLFunc) glUniform3fv;
	if (!strcmp("glUniform3i",                           procname)) return (GLFunc) glUniform3i;
	if (!strcmp("glUniform3iv",                          procname)) return (GLFunc) glUniform3iv;
	if (!strcmp("glUniform4f",                           procname)) return (GLFunc) glUniform4f;
	if (!strcmp("glUniform4fv",                          procname)) return (GLFunc) glUniform4fv;
	if (!strcmp("glUniform4i",                           procname)) return (GLFunc) glUniform4i;
	if (!strcmp("glUniform4iv",                          procname)) return (GLFunc) glUniform4iv;
	if (!strcmp("glUniformMatrix2fv",                    procname)) return (GLFunc) glUniformMatrix2fv;
	if (!strcmp("glUniformMatrix3fv",                    procname)) return (GLFunc) glUniformMatrix3fv;
	if (!strcmp("glUniformMatrix4fv",                    procname)) return (GLFunc) glUniformMatrix4fv;
	if (!strcmp("glUseProgram",                          procname)) return (GLFunc) glUseProgram;
	if (!strcmp("glValidateProgram",                     procname)) return (GLFunc) glValidateProgram;
	if (!strcmp("glVertexAttrib1f",                      procname)) return (GLFunc) glVertexAttrib1f;
	if (!strcmp("glVertexAttrib1fv",                     procname)) return (GLFunc) glVertexAttrib1fv;
	if (!strcmp("glVertexAttrib2f",                      procname)) return (GLFunc) glVertexAttrib2f;
	if (!strcmp("glVertexAttrib2fv",                     procname)) return (GLFunc) glVertexAttrib2fv;
	if (!strcmp("glVertexAttrib3f",                      procname)) return (GLFunc) glVertexAttrib3f;
	if (!strcmp("glVertexAttrib3fv",                     procname)) return (GLFunc) glVertexAttrib3fv;
	if (!strcmp("glVertexAttrib4f",                      procname)) return (GLFunc) glVertexAttrib4f;
	if (!strcmp("glVertexAttrib4fv",                     procname)) return (GLFunc) glVertexAttrib4fv;
	if (!strcmp("glVertexAttribPointer",                 procname)) return (GLFunc) glVertexAttribPointer;
	if (!strcmp("glViewport",                            procname)) return (GLFunc) glViewport;

	return NULL;
}
