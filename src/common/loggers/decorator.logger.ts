import { BadRequestException, Inject, UnauthorizedException,NotFoundException } from '@nestjs/common';
import { MyLogger } from './mylogger.logger';
import { SendGridService } from 'src/modules/send-grid/send-grid.service';

export function Log(sendGridService: SendGridService) {
  const injectLogger = Inject(MyLogger);

  return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
    injectLogger(target, 'logger'); // this is the same as using constructor(private readonly logger: LoggerService) in a class

    //get original method
    const originalMethod = propertyDescriptor.value;

    //redefine descriptor value within own function block
    propertyDescriptor.value = async function(...args: any[]) {
      const user = propertyKey != 'signIn' ? args[0] : args[0]['email']
      const logger: MyLogger = this.logger;
      logger.setContext(target.constructor.name);

      try {
        const response = await originalMethod.apply(this, args);

        this.logger.log(`ACTION: ${propertyKey}, USER: ${user.email}, STATUS: SUCCESS`)

        return response
        
      } catch (error) {
        if(error instanceof BadRequestException || error instanceof UnauthorizedException || NotFoundException){
          logger.error(`ACTION: ${propertyKey}, USER: ${user.email}, STATUS: FAILED, REASON: ${error.message}`);
          throw error
        }else{
          logger.error(`Error not catched: ${error}`)
        }
        throw new BadRequestException('Ocurrió un error inesperado, inténtalo nuevamente')

      }
    };
  };
}