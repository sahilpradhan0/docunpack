import { useAuth } from '../../context/useAuth'
const Login = () => {
  const { signInWithProvider } = useAuth();
  return (
    <main className='flex flex-col justify-center items-center gap-10 px-2'>
      <section className='flex flex-col justify-center items-center gap-5 text-center'>
        <h1 className='font-bold text-3xl sm:text-4xl'>Welcome back to DocUnpack</h1>
        <h2 className='font-medium text-gray-600'>Simplify your docs, boost your workflow. Login to continue</h2>
      </section>
      <section className='flex flex-col gap-3 justify-center items-center'>
        <button onClick={() => {
          signInWithProvider("google");
        }}
          className='cursor-pointer flex items-center gap-4 rounded-2xl bg-white sm:w-2/3 justify-center border border-gray-300 px-8 font-medium py-2 shadow-lg hover:scale-105'>
          <img src='https://developers.google.com/identity/images/g-logo.png' className='w-6 h-6' />
          <span>Continue with Google</span>
        </button>
        <span className='font-bold text-lg'>OR</span>
        <button onClick={() => {
          signInWithProvider("github");
        }} className='cursor-pointer flex items-center gap-2 rounded-2xl bg-white sm:w-2/3 justify-center border border-gray-300 px-8 font-medium py-2 shadow-lg hover:scale-105'>
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub logo"
            className="w-6 h-6"
          />
          <span>Continue with Github</span>
        </button>
        <span className='font-medium text-sm text-gray-700 text-center mt-3'>By continuing, a new account will be created if you don’t already have one.</span>
      </section>
    </main>
  )
}
export default Login