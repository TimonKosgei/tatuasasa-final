import { supabase } from './SupabaseClient'

/**
 * Resends the email confirmation link to a user.
 * @param {string} email - The user's email address.
 */
export async function resendVerification(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  })

  if (error) throw error
  return data
}

/**
 * Signs up a new user and checks for duplicate identities.
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  
  if (error) throw error

  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    const customError = new Error("An account with this email address already exists. Please log in.")
    customError.status = 409 
    throw customError
  }
  
  return data   
}
 
/**
 * Log in an existing user and normalizes specific authentication errors.
 */
/**
 * Log in an existing user and normalizes specific authentication errors.
 */
/**
 * Log in an existing user using their email and password credentials.
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data 

  } catch (err) {
    const errMsg = err.message || "";
    
    // We still isolate this because the user needs the action link to verify
    if (errMsg.includes("Email not confirmed")) {
      throw new Error("EMAIL_NOT_CONFIRMED");
    }
    
    // Treat wrong password, invalid email, or any auth block identically
    throw new Error("INVALID_CREDENTIALS");
  }
}

/**
 * Sends a password reset link to the user's email.
 * @param {string} email - The user's email address.
 */
export async function sendPasswordReset(email) {
  // getURL() helps dynamically calculate your landing path depending on localhost vs production
  const redirectToUrl = `${window.location.origin}/auth/update-password`;
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectToUrl,
  })
  if (error) throw error
  return data
}

/**
 * Updates the password for the currently authenticated or recovering user.
 * @param {string} newPassword - The new password string.
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
  return data
}
/**
 * Sign out the currently authenticated user session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}