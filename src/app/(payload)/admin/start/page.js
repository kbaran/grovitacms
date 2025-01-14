'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'

const Profile = () => {
  const [email, setEmail] = useState('')
  const searchParams = useSearchParams()

  const token = searchParams.get('token')

  console.log('🚀 Brij  ~  file: page.js 11 ~  handler: ~  token:', token)

  const userlogin = async () => {
    const myHeaders = new Headers()
    myHeaders.append('Authorization', 'users API-Key db4e7798-1a9d-4391-883e-b115be38a1ea')
    myHeaders.append('Content-Type', 'application/json')

    const requestOptions = {
      headers: myHeaders,
    }

    const val = await fetch('/api/users/oauth' + token)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error))
    //  console.log(val)
    console.log('🚀 Brij  ~  file: page.js 28 ~  handler: ~  token:', val)

    window.location.href = '/admin'
  }
  useEffect(() => {
    userlogin()
  })
  return (
    <main className="flex flex-col items-center gap-8 row-start-2 lg:w-[80%] w-[99%]   ">
      <h2 className="text-xl font-extrabold">Manage your profile {token}</h2>
      <section className=" body-font w-full"></section>
    </main>
  )
}
export default Profile
