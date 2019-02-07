/* eslint-env jest */

import { keyBy, omit } from "lodash";

import config from "../_config";
import { xo, testWithOtherConnection } from "../util";

const ADMIN_USER = {
  email: "admin2@admin.net",
  password: "admin",
  permission: "admin",
};

describe("job", () => {
  let defaultJob;

  beforeAll(() => {
    defaultJob = {
      name: "jobTest",
      timeout: 2000,
      type: "call",
      key: "snapshot",
      method: "vm.snapshot",
      paramsVector: {
        type: "crossProduct",
        items: [
          {
            type: "set",
            values: [
              {
                id: config.vmIdXoTest,
                name: "test-snapshot",
              },
            ],
          },
        ],
      },
    };
  });

  describe(".create() :", () => {
    it("creates a new job", async () => {
      const userId = await xo.createUser(ADMIN_USER);
      const { email, password } = ADMIN_USER;
      await testWithOtherConnection({ email, password }, async xo => {
        const id = await xo.createJob(defaultJob);
        expect(typeof id).toBe("string");

        const job = await xo.call("job.get", { id });
        expect(omit(job, "id", "userId")).toMatchSnapshot();
        expect(job.userId).toBe(userId);
      });
    });

    it("creates a job with a userId", async () => {
      const userId = await xo.createUser(ADMIN_USER);
      const id = await xo.createJob({ ...defaultJob, userId });
      const { userId: expectedUserId } = await xo.call("job.get", { id });
      expect(userId).toBe(expectedUserId);
    });

    it("fails trying to create a job without job params", async () => {
      await expect(xo.createJob({})).rejects.toMatchSnapshot();
    });
  });

  describe(".getAll() :", () => {
    it("gets all available jobs", async () => {
      const jobId1 = await xo.createJob(defaultJob);
      const jobId2 = await xo.createJob({
        ...defaultJob,
        name: "jobTest2",
        paramsVector: {
          type: "crossProduct",
          items: [
            {
              type: "set",
              values: [
                {
                  id: config.vmIdXoTest,
                  name: "test2-snapshot",
                },
              ],
            },
          ],
        },
      });
      let jobs = await xo.call("job.getAll");
      expect(Array.isArray(jobs)).toBe(true);
      jobs = keyBy(jobs, "id");
      expect([
        omit(jobs[jobId1], "id", "userId"),
        omit(jobs[jobId2], "id", "userId"),
      ]).toMatchSnapshot();
    });
  });

  describe(".get() :", () => {
    it("gets an existing job", async () => {
      const id = await xo.createJob(defaultJob);
      const job = await xo.call("job.get", { id });
      expect(omit(job, "id", "userId")).toMatchSnapshot();
    });

    it("fails trying to get a job with a non existent id", async () => {
      await expect(
        xo.call("job.get", { id: "non-existent-id" })
      ).rejects.toMatchSnapshot();
    });
  });
});