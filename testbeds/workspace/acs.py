import os
import asyncore

def sample():
	fd = os.open('/workspace/test.bat', os.O_RDONLY)
	data = []
	class FileDispatcher(asyncore.file_dispatcher):
		def handle_read(self):
			print('handle_read')
			data.append(self.recv(29))
	s = FileDispatcher(fd)
	asyncore.loop(timeout=0.01, use_poll=True, count=2)
	os.close(fd)
	print(data)
