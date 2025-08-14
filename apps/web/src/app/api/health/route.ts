import { NextRequest, NextResponse } from "next/server";

/**
 * Health check endpoint for the Next.js web app
 * Verifies proxy connectivity to the LangGraph server
 */
export async function GET(request: NextRequest) {
  try {
    const langGraphUrl = process.env.LANGGRAPH_API_URL ?? "http://localhost:2024";
    const nodeEnv = process.env.NODE_ENV || "development";
    
    // Test connectivity to LangGraph server
    let langGraphStatus = "unknown";
    let langGraphError = null;
    
    try {
      const healthCheckUrl = `${langGraphUrl}/health`;
      const response = await fetch(healthCheckUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Use a shorter timeout for health checks
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        langGraphStatus = "healthy";
      } else {
        langGraphStatus = "unhealthy";
        langGraphError = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      langGraphStatus = "unreachable";
      langGraphError = error.message || "Connection failed";
    }
    
    const healthData = {
      status: langGraphStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      service: "open-swe-web",
      environment: nodeEnv,
      uptime: process.uptime(),
      version: process.version,
      langgraph: {
        url: langGraphUrl,
        status: langGraphStatus,
        error: langGraphError,
      },
    };
    
    // Return 200 for healthy, 503 for degraded service
    const statusCode = langGraphStatus === "healthy" ? 200 : 503;
    
    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        service: "open-swe-web",
        error: "Health check failed",
      },
      { status: 500 }
    );
  }
}
