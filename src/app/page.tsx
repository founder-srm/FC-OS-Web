import Image from "next/image";
import Link from "next/link";

const HomePage = () => {
  return (
    <main className="relative flex h-svh max-h-svh flex-1 overflow-hidden bg-background">
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 " />
      <div className="relative z-10 flex w-full items-center justify-center flex-col mb-40">
        <div className="max-w-xl rounded-2xl font-serif text-9xl tracking-tight">
          FC OS
        </div>
        <div className="flex items-center gap-4 font-serif mt-6">
          <Link
            href={"/login"}
            className="text-xl px-5 py-1 backdrop-blur-xs rounded-xl border border-white/10 shadow-2xl"
          >
            Log In
          </Link>
          <Link
            href={"/login"}
            className="text-xl px-5 py-1 backdrop-blur-xs rounded-xl border border-white/10 shadow-2xl"
          >
            Request Access
          </Link>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
