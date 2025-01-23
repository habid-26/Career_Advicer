import { useEffect, useState } from "react";

const careerAdviceDescription = `
Call this function when a user asks for career advice. The function should return a structured JSON object containing the topic and the advice. 
Make sure the advice is practical, actionable, and relevant to the specified topic. For example, if the topic is 'networking', provide tips on how to effectively network in a professional setting.

The advice should be broken down into clear, concise steps or tips that the user can follow. Each piece of advice should be supported by examples or best practices. 
Consider including the following elements:
- An introduction to the topic and its importance in career development.
- Specific strategies or actions the user can take.
- Common pitfalls to avoid and how to overcome them.
- Additional resources or tools that can help the user further explore the topic.

Ensure that the advice is tailored to the user's level of experience and industry, if specified.
`;

const jobPostDescription = `
Call this function when a user asks for job-post creation. The function should return a structured JSON object containing the job title, description, and requirements.

The job post should be detailed and professional, aimed at attracting qualified candidates. Consider including the following elements:
- A compelling job title that accurately reflects the role.
- A comprehensive job description that outlines the key responsibilities and expectations.
- A list of required and preferred qualifications, including skills, experience, and education.
- Information about the company culture, values, and mission to attract candidates who align with the organization's goals.
- Details about the application process and any deadlines.

Ensure that the job post is clear, concise, and free of jargon. It should be written in a way that is inclusive and encourages a diverse range of candidates to apply.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "provide_career_advice",
        description: careerAdviceDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            topic: {
              type: "string",
              description: "The specific career topic or area of interest (e.g., 'networking', 'skills').",
            },
            advice: {
              type: "string",
              description: "A detailed piece of advice related to the specified topic.",
            },
          },
          required: ["topic", "advice"],
        },
      },
      {
        type: "function",
        name: "create_job_post",
        description: jobPostDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            title: {
              type: "string",
              description: "The job title.",
            },
            description: {
              type: "string",
              description: "A detailed job description.",
            },
            requirements: {
              type: "string",
              description: "The job requirements.",
            },
          },
          required: ["title", "description", "requirements"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

const logUserInteraction = (interaction) => {
  console.log("User Interaction:", interaction);
};

const handleError = (error) => {
  console.error("Error:", error);
  return { error: error.message };
};

function FunctionCallOutput({ functionCallOutput }) {
  try {
    const { topic, advice, title, description, requirements } = JSON.parse(functionCallOutput.arguments);

    return (
      <div className="flex flex-col gap-2">
        {topic && advice && (
          <>
            <p>
              <strong>Career Advice:</strong>
            </p>
            <p>
              <strong>Topic:</strong> {topic}
            </p>
            <p>
              <strong>Advice:</strong> {advice}
            </p>
          </>
        )}
        {title && description && requirements && (
          <>
            <p>
              <strong>Job Post:</strong>
            </p>
            <p>
              <strong>Title:</strong> {title}
            </p>
            <p>
              <strong>Description:</strong> {description}
            </p>
            <p>
              <strong>Requirements:</strong> {requirements}
            </p>
          </>
        )}
        <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
          {JSON.stringify(functionCallOutput, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    return <pre className="text-xs bg-red-100 rounded-md p-2 overflow-x-auto">{JSON.stringify(handleError(error), null, 2)}</pre>;
  }
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          (output.type === "function_call" && output.name === "provide_career_advice") ||
          (output.type === "function_call" && output.name === "create_job_post")
        ) {
          setFunctionCallOutput(output);
          logUserInteraction(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                Ask for feedback about the ${output.name === "provide_career_advice" ? "career advice" : "job post"} provided.
              `,
              },
            });
          }, 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Career Advice and Job Post Tool</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <p>Ask for career advice or create a job post...</p>
          )
        ) : (
          <p>Start the session to use this tool...</p>
        )}
      </div>
    </section>
  );
}
