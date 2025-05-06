import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import { getBaseUrl } from "@/lib/utils";

interface VerificationEmailProps {
  username: string;
  verificationToken: string;
  planType?: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  username,
  verificationToken,
  planType,
}) => {
  const baseUrl = getBaseUrl();
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}${planType ? `&plan=${planType}` : ""}`;

  return (
    <Html>
      <Head />
      <Preview>Verify your email for LocaPosty</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email</Heading>
          <Section>
            <Text style={text}>Hey {username},</Text>
            <Text style={text}>
              Thanks for signing up for LocaPosty! Please verify your email
              address to get full access to your account.
              {planType && (
                <span>
                  {" "}
                  You&apos;ll be able to start your free {planType} plan trial
                  after verification.
                </span>
              )}
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email
            </Button>
            <Text style={text}>
              Or copy and paste this URL into your browser:
              <br />
              <a href={verificationUrl} style={link}>
                {verificationUrl}
              </a>
            </Text>
            <Text style={text}>
              If you didn&apos;t create an account with LocaPosty, you can
              safely ignore this email.
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {new Date().getFullYear()} LocaPosty. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const button = {
  backgroundColor: "#4F46E5",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "200px",
  padding: "12px 24px",
  margin: "30px auto",
};

const link = {
  color: "#4F46E5",
  textDecoration: "underline",
  fontSize: "14px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "30px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  marginTop: "20px",
  textAlign: "center" as const,
};
