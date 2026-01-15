import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const parameterCache = new Map<string, string>();

const get = async (name: string): Promise<string> => {
  if (parameterCache.has(name)) {
    return parameterCache.get(name)!;
  }

  const client = new SSMClient();

  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });
  const response = await client.send(command);

  if (!response.Parameter?.Value) {
    throw new Error(`SSM parameter not found: ${name}`);
  }

  parameterCache.set(name, response.Parameter.Value);
  return response.Parameter.Value;
};

export const params = {
  get,
};
