//
//  CreateActivityViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "CreateActivityViewController.h"
#import "GlobalStyles.h"
#import "GlobalNetwork.h"
#import "Activity.h"

@interface CreateActivityViewController ()

@end

@implementation CreateActivityViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        [[self view] setBackgroundColor:[[GlobalStyles sharedGlobal] backgroundGreyColor]];
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    self.datePicker.minimumDate = [NSDate date];
    
    // Handle dismissing keyboard for text input
    self.activityTitle.delegate = self;
    
    // TODO: Pull the user's name
    NSString *nameString = @"Owen Campbell-Moore";
    NSString *joinedString = [nameString stringByAppendingString: @" is"];
    NSMutableAttributedString *nameIsString = [[NSMutableAttributedString alloc] initWithString:joinedString attributes:@{}];
    
    // Set sections of the text to have the correct styles
    
    NSDictionary *emphasisTextAttributes = [[GlobalStyles sharedGlobal] emphasisTextAttributes];
    NSRange userNameRange = {0, [nameString length]};
    [nameIsString setAttributes:emphasisTextAttributes range:userNameRange];
    
    NSDictionary *regularTextAttributes = [[GlobalStyles sharedGlobal] regularTextAttributes];
    NSRange isRange = {[nameString length], 3};
    [nameIsString setAttributes:regularTextAttributes range:isRange];
    
    self.nameIsLabel.attributedText = nameIsString;
    
    self.atLabel.attributedText = [[NSAttributedString alloc] initWithString:@"at " attributes:regularTextAttributes];
    
    // Set miscellanious styles
    UIImage *cardBackground = [[UIImage imageNamed:@"cardBackground.png"] resizableImageWithCapInsets:UIEdgeInsetsMake(2.0, 2.0, 3.0, 2.0)];
    self.cardBackgroundView.image = cardBackground;
    [self.createButton setTintColor: [[GlobalStyles sharedGlobal] textBlueColor]];
}

- (BOOL)textFieldShouldReturn:(UITextField *)theTextField {
    if (theTextField == self.activityTitle) {
        [theTextField resignFirstResponder];
    }
    return YES;
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)createActivityPressed:(id)sender {
    Activity *activity = [[Activity alloc] init];
    activity.title = [[self activityTitle] text];
    activity.description = @"";
    activity.location = [[self activityLocation] text];
    activity.max_attendees = @"-1";
    activity.start_time = [[self datePicker] date];
    
    [[GlobalNetwork sharedGlobal] createActivity:activity];
    
    // Pop this controller
    [self.navigationController popViewControllerAnimated:YES];
}
@end
