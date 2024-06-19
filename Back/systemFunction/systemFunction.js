require('dotenv').config()
const {RecaptchaEnterpriseServiceClient} = require('@google-cloud/recaptcha-enterprise')

class systemFunction {

  async createAssessment(token,action){
    const client = new RecaptchaEnterpriseServiceClient();
    let projectID = process.env.projectID
    let recaptchaKey = process.env.recaptchaKey
    const projectPath = client.projectPath(projectID);

      // Build the assessment request.
      const request = ({
        assessment: {
          event: {
            token: token,
            siteKey: recaptchaKey,
          },
        },
        parent: projectPath,
      });

      const [ response ] = await client.createAssessment(request);

      // Check if the token is valid.
      if (!response.tokenProperties.valid) {
        console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
        return null;
      }

      // Check if the expected action was executed.
      // The action property is set by user client in the grecaptcha.enterprise.execute() method.
      if (response.tokenProperties.action === recaptchaAction) {
        // Get the risk score and the reason(s).
        // For more information on interpreting the assessment, see:
        // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
        console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
        response.riskAnalysis.reasons.forEach((reason) => {
          console.log(reason);
        });

        return response.riskAnalysis.score;
      } else {
        console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
        return null;
      }
  }

  objIsEmpty(obj) {
    for (let key in obj) { 
      return false;
    }
    return true;
  }
  
}

module.exports = new systemFunction()