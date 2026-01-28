export class EmailService {
  async sendPasswordReset(email: string, resetToken: string) {
    console.log("[EmailService] Password reset", {
      email,
      resetToken,
    });
  }

  async sendVerifyEmail(email: string, token: string) {
    console.log("[EmailService] Verify email", {
      email,
      token,
    });
  }
}

export const emailService = new EmailService();
