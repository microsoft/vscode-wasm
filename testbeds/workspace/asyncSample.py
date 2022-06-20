import asyncio

async def say_hello():
   await asyncio.sleep(3)
   print( 'Hello, World??' )

def main():
    loop = asyncio.get_event_loop()
    loop.run_until_complete(say_hello())
    loop.close()