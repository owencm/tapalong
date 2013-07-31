//
//  LoginViewController.h
//  Activities
//
//  Created by Owen Campbell-Moore on 30/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "AppDelegate.h"

@interface LoginViewController : UIViewController
- (IBAction)performLogin:(id)sender;
- (void)loginFailed;

@end
